import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  Plan,
  PlanDocument,
  Subscription,
  SubscriptionDocument,
  User,
  UserDocument,
  UserRole,
  Workspace,
  WorkspaceDocument,
} from '../database/schemas';
import { DatabaseConnectionService } from '../database/database-connection.service';
import { FREE_PLAN } from '../plans/default-plans';

type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  workspaceId: string;
  role: UserRole;
};

type AuthResponse = {
  user: AuthUserResponse;
  accessToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly databaseConnectionService: DatabaseConnectionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResponse> {
    await this.databaseConnectionService.ensureReadyOrThrow('signup');

    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const workspaceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const role = await this.resolveDesiredRole(email);

    await this.workspaceModel.create({
      _id: workspaceId,
      name: `${name}'s Workspace`,
      ownerUserId: userId,
      members: [userId],
    });

    let user: UserDocument;

    try {
      user = await this.userModel.create({
        _id: userId,
        email,
        name,
        passwordHash,
        plan: FREE_PLAN.name,
        credits: FREE_PLAN.creditLimit,
        role,
        workspaceId,
        tokenVersion: 0,
        isEmailVerified: false,
      });
    } catch (error) {
      await this.workspaceModel.findByIdAndDelete(workspaceId);
      throw error;
    }

    await this.ensureFreeSubscription(userId, workspaceId);

    const accessToken = await this.createAccessToken(user);

    return {
      user: this.toAuthUser(user),
      accessToken,
    };
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    await this.databaseConnectionService.ensureReadyOrThrow('login');

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.userModel.findOne({ email });
    if (!existingUser) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, existingUser.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = await this.syncUserRole(existingUser);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.createAccessToken(user);

    return {
      user: this.toAuthUser(user),
      accessToken,
    };
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.databaseConnectionService.ensureReadyOrThrow('logout');

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { tokenVersion: 1 },
    });

    return { success: true };
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    await this.databaseConnectionService.ensureReadyOrThrow('loading your session');

    const existingUser = await this.userModel.findById(userId);
    if (!existingUser) {
      throw new UnauthorizedException('User not found.');
    }

    const user = await this.syncUserRole(existingUser);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return this.toAuthUser(user);
  }

  private async createAccessToken(user: UserDocument): Promise<string> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      workspaceId: user.workspaceId.toString(),
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.signAsync(payload);
  }

  private toAuthUser(
    user: Pick<
      UserDocument,
      '_id' | 'name' | 'email' | 'plan' | 'credits' | 'workspaceId' | 'role'
    >,
  ): AuthUserResponse {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      credits: user.credits,
      workspaceId: user.workspaceId.toString(),
      role: user.role ?? 'user',
    };
  }

  private async ensureFreeSubscription(
    userId: Types.ObjectId,
    workspaceId: Types.ObjectId,
  ): Promise<void> {
    const freePlan = await this.planModel.findOne({ name: FREE_PLAN.name }).lean();
    if (!freePlan) {
      return;
    }

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    await this.subscriptionModel.updateOne(
      {
        userId,
        workspaceId,
      },
      {
        $setOnInsert: {
          planId: freePlan._id,
          status: 'active',
          renewalDate,
          paymentProviderId: '',
        },
      },
      { upsert: true },
    );
  }

  private async syncUserRole(user: UserDocument): Promise<UserDocument> {
    const desiredRole = await this.resolveDesiredRole(user.email, user._id);
    const currentRole = user.role ?? 'user';

    if (currentRole === desiredRole) {
      return user;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          role: desiredRole,
        },
      },
      {
        new: true,
      },
    );

    return updatedUser ?? user;
  }

  private async resolveDesiredRole(
    email: string,
    userId?: Types.ObjectId,
  ): Promise<UserRole> {
    const adminEmails = this.getAdminEmails();
    if (adminEmails.has(email)) {
      return 'admin';
    }

    const existingAdmin = await this.userModel.exists({
      role: 'admin',
      ...(userId ? { _id: { $ne: userId } } : {}),
    });

    if (existingAdmin) {
      return 'user';
    }

    const oldestUser = await this.userModel
      .findOne()
      .sort({ createdAt: 1, _id: 1 })
      .select('_id')
      .lean();

    if (!oldestUser) {
      return 'admin';
    }

    return userId && oldestUser._id.toString() === userId.toString() ? 'admin' : 'user';
  }

  private getAdminEmails(): Set<string> {
    return new Set(
      (this.configService.get<string>('ADMIN_EMAILS', '') || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );
  }
}
