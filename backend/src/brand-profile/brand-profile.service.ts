import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DatabaseConnectionService } from '../database/database-connection.service';
import { BrandProfile, BrandProfileDocument } from '../database/schemas';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';

@Injectable()
export class BrandProfileService {
  constructor(
    @InjectModel(BrandProfile.name)
    private readonly brandProfileModel: Model<BrandProfileDocument>,
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  async getProfile(user: AuthenticatedUser) {
    await this.databaseConnectionService.ensureReadyOrThrow('loading your brand profile');

    return this.brandProfileModel
      .findOne({
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      })
      .lean();
  }

  async upsertProfile(user: AuthenticatedUser, input: UpsertBrandProfileDto) {
    await this.databaseConnectionService.ensureReadyOrThrow('saving your brand profile');

    return this.brandProfileModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      },
      {
        $set: {
          businessName: input.businessName.trim(),
          niche: input.niche.trim(),
          tone: input.tone.trim(),
          targetAudience: input.targetAudience.trim(),
          goal: input.goal.trim(),
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }
}
