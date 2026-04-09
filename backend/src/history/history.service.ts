import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DatabaseConnectionService } from '../database/database-connection.service';
import { PostRecord, PostRecordDocument } from '../database/schemas';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(PostRecord.name)
    private readonly postRecordModel: Model<PostRecordDocument>,
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  async listPosts(user: AuthenticatedUser, limit = 30) {
    await this.databaseConnectionService.ensureReadyOrThrow('loading history');

    const safeLimit = Math.min(Math.max(limit, 1), 100);

    return this.postRecordModel
      .find({
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  }

  async updateStatus(
    user: AuthenticatedUser,
    postId: string,
    status: 'draft' | 'scheduled' | 'published',
  ) {
    await this.databaseConnectionService.ensureReadyOrThrow('updating post status');

    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id.');
    }

    const updated = await this.postRecordModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(postId),
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      },
      {
        $set: { status },
      },
      {
        new: true,
      },
    );

    if (!updated) {
      throw new NotFoundException('Post not found.');
    }

    return updated;
  }
}
