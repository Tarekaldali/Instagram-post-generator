import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { allowedGoals, allowedTones } from '../post/dto/generate-post.dto';
import {
  ImageGeneration,
  ImageGenerationDocument,
  PostRecord,
  PostRecordDocument,
  Template,
  TemplateDocument,
} from '../database/schemas';
import { GenerateAiImageDto } from './dto/generate-ai-image.dto';
import { GenerateAiPostDto } from './dto/generate-ai-post.dto';
import { PostService } from '../post/post.service';
import { UsageService } from '../usage/usage.service';

const POST_GENERATION_CREDITS = 8;
const IMAGE_GENERATION_CREDITS = 4;

type StorageReadyAsset = {
  sourceUrl: string;
  storagePath: string;
};

type BaseGeneratedPayload = {
  caption: string;
  imageUrl: string;
  hooks: string[];
  hashtags: string[];
};

@Injectable()
export class AiService {
  constructor(
    private readonly postService: PostService,
    private readonly usageService: UsageService,
    @InjectModel(PostRecord.name)
    private readonly postRecordModel: Model<PostRecordDocument>,
    @InjectModel(ImageGeneration.name)
    private readonly imageGenerationModel: Model<ImageGenerationDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
  ) {}

  async generatePost(user: AuthenticatedUser, input: GenerateAiPostDto) {
    await this.usageService.chargeCredits({
      userId: user.userId,
      workspaceId: user.workspaceId,
      action: 'ai_generate_post',
      creditsUsed: POST_GENERATION_CREDITS,
      metadata: {
        niche: input.niche,
        goal: input.goal,
        tone: input.tone,
      },
    });

    try {
      const generation = (await this.postService.generate({
        niche: input.niche,
        tone: this.toPostTone(input.tone),
        goal: this.toPostGoal(input.goal),
        description: input.description,
      })) as BaseGeneratedPayload;

      const template = input.templateId
        ? await this.templateModel.findOne({
            _id: new Types.ObjectId(input.templateId),
            workspaceId: new Types.ObjectId(user.workspaceId),
          })
        : null;

      const optimizedPrompt = this.optimizePostPrompt(input, generation, template?.name);
      const now = new Date();

      const postRecord = await this.postRecordModel.create({
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
        hook: generation.hooks[0] ?? 'Generated hook',
        caption: generation.caption,
        hashtags: generation.hashtags,
        imageUrl: generation.imageUrl,
        status: 'draft',
        optimizedPrompt,
        createdAt: now,
        updatedAt: now,
      });

      if (generation.imageUrl) {
        await this.imageGenerationModel.create({
          userId: new Types.ObjectId(user.userId),
          workspaceId: new Types.ObjectId(user.workspaceId),
          prompt: optimizedPrompt,
          model: this.postService.getRuntimeStatus().provider.imageModel,
          imageUrl: generation.imageUrl,
          createdAt: now,
          updatedAt: now,
        });
      }

      const creditsState = await this.usageService.getCredits(user.userId);
      const storageAsset = this.toStorageReadyAsset(generation.imageUrl, user.userId);

      return {
        postId: postRecord._id.toString(),
        hook: postRecord.hook,
        caption: postRecord.caption,
        hashtags: postRecord.hashtags,
        image: storageAsset,
        optimizedPrompt,
        creditsRemaining: creditsState.credits,
        plan: creditsState.plan,
      };
    } catch (error) {
      await this.usageService.grantCredits(user.userId, POST_GENERATION_CREDITS);
      throw error;
    }
  }

  async generateImage(user: AuthenticatedUser, input: GenerateAiImageDto) {
    await this.usageService.chargeCredits({
      userId: user.userId,
      workspaceId: user.workspaceId,
      action: 'ai_generate_image',
      creditsUsed: IMAGE_GENERATION_CREDITS,
      metadata: {
        style: input.style ?? '',
      },
    });

    try {
      const optimizedPrompt = this.optimizeImagePrompt(input);

      const generation = (await this.postService.generate({
        niche: 'visual content',
        tone: this.toPostTone(input.style ?? ''),
        goal: 'engagement',
        description: optimizedPrompt,
      })) as BaseGeneratedPayload;

      const imageUrl = generation.imageUrl;
      const now = new Date();

      await this.imageGenerationModel.create({
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
        prompt: optimizedPrompt,
        model: this.postService.getRuntimeStatus().provider.imageModel,
        imageUrl,
        createdAt: now,
        updatedAt: now,
      });

      const creditsState = await this.usageService.getCredits(user.userId);

      return {
        image: this.toStorageReadyAsset(imageUrl, user.userId),
        optimizedPrompt,
        creditsRemaining: creditsState.credits,
        plan: creditsState.plan,
      };
    } catch (error) {
      await this.usageService.grantCredits(user.userId, IMAGE_GENERATION_CREDITS);
      throw error;
    }
  }

  private optimizePostPrompt(
    input: GenerateAiPostDto,
    generation: BaseGeneratedPayload,
    templateName?: string,
  ): string {
    const lines = [
      `Niche: ${input.niche}`,
      `Tone: ${input.tone}`,
      `Goal: ${input.goal}`,
      `Primary Hook: ${generation.hooks[0] ?? ''}`,
      `Caption Direction: ${generation.caption.slice(0, 240)}`,
      `Template: ${templateName ?? 'none'}`,
      `Audience Intent: ${input.description ?? 'engagement growth'}`,
      'Output requirement: instagram-native, emotionally specific, high save-rate potential.',
    ];

    return lines.join('\n');
  }

  private optimizeImagePrompt(input: GenerateAiImageDto): string {
    const style = input.style?.trim() || 'premium social media';
    return [
      input.prompt.trim(),
      `Style: ${style}`,
      'Format: square 1:1, no text overlay, cinematic lighting, scroll-stopping composition.',
    ].join('\n');
  }

  private toStorageReadyAsset(imageUrl: string, userId: string): StorageReadyAsset {
    const extension = imageUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    const datePrefix = new Date().toISOString().slice(0, 10);

    return {
      sourceUrl: imageUrl,
      storagePath: `users/${userId}/${datePrefix}/${randomUUID()}.${extension}`,
    };
  }

  private toPostTone(value: string): (typeof allowedTones)[number] {
    const normalized = value.trim().toLowerCase();

    if (allowedTones.includes(normalized as (typeof allowedTones)[number])) {
      return normalized as (typeof allowedTones)[number];
    }

    if (normalized.includes('fun')) {
      return 'funny';
    }

    if (normalized.includes('bold') || normalized.includes('strong')) {
      return 'bold';
    }

    if (normalized.includes('aggress')) {
      return 'aggressive';
    }

    return 'professional';
  }

  private toPostGoal(value: string): (typeof allowedGoals)[number] {
    const normalized = value.trim().toLowerCase();

    if (allowedGoals.includes(normalized as (typeof allowedGoals)[number])) {
      return normalized as (typeof allowedGoals)[number];
    }

    if (normalized.includes('sale') || normalized.includes('convert')) {
      return 'sales';
    }

    if (normalized.includes('follow')) {
      return 'followers';
    }

    return 'engagement';
  }
}
