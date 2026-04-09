import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from '../database/schemas';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'dev_jwt_secret_change_me'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException('Invalid token payload.');
    }

    const user = await this.userModel.findById(payload.sub).lean();
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated.');
    }

    return {
      userId: user._id.toString(),
      workspaceId: user.workspaceId.toString(),
      email: user.email,
      name: user.name,
      plan: user.plan,
      credits: user.credits,
      role: user.role ?? 'user',
      tokenVersion: user.tokenVersion,
    };
  }
}
