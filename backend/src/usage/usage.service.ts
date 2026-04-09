import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseConnectionService } from '../database/database-connection.service';
import { UsageLog, UsageLogDocument, User, UserDocument } from '../database/schemas';

type ChargeCreditsInput = {
  userId: string;
  workspaceId: string;
  action: string;
  creditsUsed: number;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class UsageService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(UsageLog.name)
    private readonly usageLogModel: Model<UsageLogDocument>,
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  async getCredits(userId: string) {
    await this.databaseConnectionService.ensureReadyOrThrow('loading credits');

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return {
      plan: user.plan,
      credits: user.credits,
    };
  }

  async getUsageLogs(userId: string, workspaceId: string, limit = 20) {
    await this.databaseConnectionService.ensureReadyOrThrow('loading usage logs');

    const safeLimit = Math.min(Math.max(limit, 1), 100);

    return this.usageLogModel
      .find({
        userId: new Types.ObjectId(userId),
        workspaceId: new Types.ObjectId(workspaceId),
      })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  }

  async chargeCredits(input: ChargeCreditsInput) {
    await this.databaseConnectionService.ensureReadyOrThrow('charging credits');

    if (input.creditsUsed < 0) {
      throw new BadRequestException('creditsUsed cannot be negative.');
    }

    const userObjectId = new Types.ObjectId(input.userId);
    const workspaceObjectId = new Types.ObjectId(input.workspaceId);

    let updatedUser: UserDocument | null = null;
    if (input.creditsUsed > 0) {
      updatedUser = await this.userModel.findOneAndUpdate(
        {
          _id: userObjectId,
          workspaceId: workspaceObjectId,
          credits: { $gte: input.creditsUsed },
        },
        {
          $inc: { credits: -input.creditsUsed },
        },
        {
          new: true,
        },
      );

      if (!updatedUser) {
        throw new BadRequestException('Insufficient credits. Upgrade your plan to continue.');
      }
    } else {
      updatedUser = await this.userModel.findOne({
        _id: userObjectId,
        workspaceId: workspaceObjectId,
      });
    }

    if (!updatedUser) {
      throw new BadRequestException('User not found for credit operation.');
    }

    await this.usageLogModel.create({
      userId: userObjectId,
      workspaceId: workspaceObjectId,
      action: input.action,
      creditsUsed: input.creditsUsed,
      metadata: input.metadata ?? {},
    });

    return {
      creditsRemaining: updatedUser.credits,
      plan: updatedUser.plan,
    };
  }

  async grantCredits(userId: string, amount: number) {
    await this.databaseConnectionService.ensureReadyOrThrow('granting credits');

    if (amount <= 0) {
      throw new BadRequestException('amount must be greater than 0.');
    }

    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: amount },
      },
      {
        new: true,
      },
    );

    if (!updated) {
      throw new BadRequestException('User not found.');
    }

    return {
      credits: updated.credits,
      plan: updated.plan,
    };
  }
}
