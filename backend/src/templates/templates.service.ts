import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DatabaseConnectionService } from '../database/database-connection.service';
import { Template, TemplateDocument } from '../database/schemas';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  async findAll(user: AuthenticatedUser) {
    await this.databaseConnectionService.ensureReadyOrThrow('loading templates');

    return this.templateModel
      .find({
        $or: [
          {
            workspaceId: new Types.ObjectId(user.workspaceId),
          },
          {
            isSystem: true,
          },
        ],
      })
      .sort({ isSystem: -1, createdAt: -1 })
      .lean();
  }

  async create(user: AuthenticatedUser, input: CreateTemplateDto) {
    await this.databaseConnectionService.ensureReadyOrThrow('creating a template');

    return this.templateModel.create({
      userId: new Types.ObjectId(user.userId),
      workspaceId: new Types.ObjectId(user.workspaceId),
      name: input.name.trim(),
      hookTemplate: input.hookTemplate.trim(),
      captionTemplate: input.captionTemplate.trim(),
      hashtagTemplate: input.hashtagTemplate ?? [],
      isSystem: false,
    });
  }

  async update(user: AuthenticatedUser, templateId: string, input: UpdateTemplateDto) {
    await this.databaseConnectionService.ensureReadyOrThrow('updating a template');

    const id = this.toObjectIdOrThrow(templateId);

    const updated = await this.templateModel.findOneAndUpdate(
      {
        _id: id,
        workspaceId: new Types.ObjectId(user.workspaceId),
        isSystem: false,
      },
      {
        $set: {
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(input.hookTemplate ? { hookTemplate: input.hookTemplate.trim() } : {}),
          ...(input.captionTemplate ? { captionTemplate: input.captionTemplate.trim() } : {}),
          ...(input.hashtagTemplate ? { hashtagTemplate: input.hashtagTemplate } : {}),
        },
      },
      {
        new: true,
      },
    );

    if (!updated) {
      throw new NotFoundException('Template not found or cannot be edited.');
    }

    return updated;
  }

  async remove(user: AuthenticatedUser, templateId: string) {
    await this.databaseConnectionService.ensureReadyOrThrow('deleting a template');

    const id = this.toObjectIdOrThrow(templateId);

    const deleted = await this.templateModel.findOneAndDelete({
      _id: id,
      workspaceId: new Types.ObjectId(user.workspaceId),
      isSystem: false,
    });

    if (!deleted) {
      throw new NotFoundException('Template not found or cannot be deleted.');
    }

    return {
      success: true,
    };
  }

  private toObjectIdOrThrow(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid template id.');
    }
    return new Types.ObjectId(value);
  }
}
