import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import OpenAI from 'openai';
import { Model } from 'mongoose';
import { GeneratePostDto } from './dto/generate-post.dto';
import { GeneratedPost, GeneratedPostDocument } from './schemas/post.schema';

type GeneratedPayload = {
  hooks: string[];
  caption: string;
  hashtags: string[];
};

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;
  private readonly imageModel: string;
  private readonly imageSize: '256x256' | '512x512' | '1024x1024';
  private readonly usingOpenRouter: boolean;

  constructor(
    @InjectModel(GeneratedPost.name)
    private readonly postModel: Model<GeneratedPostDocument>,
    private readonly configService: ConfigService,
  ) {
    const openrouterKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const apiKey = openrouterKey || openaiKey;

    const explicitOpenRouterBaseUrl = this.configService.get<string>('OPENROUTER_BASE_URL');
    const inferOpenRouterFromKey = apiKey ? apiKey.startsWith('sk-or-') : false;
    this.usingOpenRouter = Boolean(openrouterKey || explicitOpenRouterBaseUrl || inferOpenRouterFromKey);

    const baseURL = this.usingOpenRouter
      ? this.configService.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
      : undefined;

    const referer = this.configService.get<string>('OPENROUTER_SITE_URL');
    const title = this.configService.get<string>('OPENROUTER_SITE_NAME');

    this.openai = apiKey
      ? new OpenAI({
          apiKey,
          baseURL,
          defaultHeaders: this.usingOpenRouter
            ? {
                ...(referer ? { 'HTTP-Referer': referer } : {}),
                ...(title ? { 'X-OpenRouter-Title': title } : {}),
              }
            : undefined,
        })
      : null;

    this.model = this.configService.get<string>(
      'OPENAI_MODEL',
      this.usingOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
    );
    this.imageModel = this.configService.get<string>(
      'OPENAI_IMAGE_MODEL',
      this.usingOpenRouter ? 'google/gemini-2.5-flash-image' : 'dall-e-2',
    );
    const configuredSize = this.configService.get<string>('OPENAI_IMAGE_SIZE', '512x512');
    this.imageSize =
      configuredSize === '256x256' || configuredSize === '1024x1024' ? configuredSize : '512x512';
  }

  async generate(input: GeneratePostDto) {
    if (!this.openai) {
      throw new BadRequestException(
        'API key is missing. Set OPENROUTER_API_KEY or OPENAI_API_KEY in backend environment.',
      );
    }

    const prompt = this.buildPrompt(input);

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.95,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a world-class Instagram copywriter. Keep hooks short, emotional, and thumb-stopping. Never return generic AI-sounding phrases.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new InternalServerErrorException('OpenAI returned an empty response.');
      }

      const parsed = this.parsePayload(raw);
      const imageUrl = await this.generateImage(input, parsed);

      const post = await this.postModel.create({
        niche: input.niche,
        tone: input.tone,
        goal: input.goal,
        description: input.description ?? '',
        caption: parsed.caption,
        imageUrl: imageUrl ?? '',
        hooks: parsed.hooks,
        hashtags: parsed.hashtags,
      });

      return {
        id: post._id,
        niche: post.niche,
        tone: post.tone,
        goal: post.goal,
        description: post.description,
        caption: post.caption,
        imageUrl: post.imageUrl,
        hooks: post.hooks,
        hashtags: post.hashtags,
        createdAt: post.createdAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown generation error.';
      this.logger.error(`OpenAI generation failed: ${message}`);

      const lower = message.toLowerCase();

      if (lower.includes('incorrect api key') || (lower.includes('api key') && lower.includes('401'))) {
        throw new BadRequestException(
          this.usingOpenRouter
            ? 'OpenRouter API key is invalid. Update OPENROUTER_API_KEY in backend environment.'
            : 'OpenAI API key is invalid. Update OPENAI_API_KEY in backend environment.',
        );
      }

      if (lower.includes('does not exist') && lower.includes('model')) {
        throw new BadRequestException(
          'Configured OpenAI model is not available for this key. Update OPENAI_MODEL.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to generate post content. Please try again.',
      );
    }
  }

  async findAll() {
    return this.postModel.find().sort({ createdAt: -1 }).limit(50).lean();
  }

  private buildPrompt(input: GeneratePostDto): string {
    return [
      'Generate an Instagram post package as JSON only. Do not include markdown.',
      '',
      'Input context:',
      `- Niche: ${input.niche}`,
      `- Tone: ${input.tone}`,
      `- Goal: ${input.goal}`,
      `- Optional description: ${input.description || 'None provided'}`,
      '',
      'Rules:',
      '1) hooks must be exactly 5 short hooks, each maximum 9 words.',
      '2) hooks must feel human, punchy, and viral.',
      '3) caption must be natural, story-driven, and engaging with a clear CTA that matches the goal.',
      '4) avoid overused AI phrases like "unlock," "in the digital age," or "game-changing."',
      '5) hashtags should be 12-18 items, lowercase, without spaces, and start with #.',
      '6) keep writing platform-native for Instagram.',
      '',
      'Return exactly this JSON schema:',
      '{',
      '  "hooks": ["...", "...", "...", "...", "..."],',
      '  "caption": "...",',
      '  "hashtags": ["#...", "#..."]',
      '}',
    ].join('\n');
  }

  private parsePayload(raw: string): GeneratedPayload {
    let parsed: GeneratedPayload;

    try {
      parsed = JSON.parse(raw) as GeneratedPayload;
    } catch {
      throw new BadRequestException('Could not parse generated content from OpenAI.');
    }

    if (!Array.isArray(parsed.hooks) || parsed.hooks.length !== 5) {
      throw new BadRequestException('OpenAI response must include exactly 5 hooks.');
    }

    if (!parsed.caption || typeof parsed.caption !== 'string') {
      throw new BadRequestException('OpenAI response must include a caption string.');
    }

    if (!Array.isArray(parsed.hashtags) || parsed.hashtags.length < 8) {
      throw new BadRequestException('OpenAI response must include enough hashtags.');
    }

    const hooks = parsed.hooks.map((hook) => this.cleanText(hook)).slice(0, 5);
    const caption = this.cleanText(parsed.caption);
    const hashtags = parsed.hashtags
      .map((hashtag) => this.cleanText(hashtag).toLowerCase())
      .map((hashtag) => (hashtag.startsWith('#') ? hashtag : `#${hashtag}`))
      .filter((hashtag) => hashtag.length > 1)
      .slice(0, 18);

    return {
      hooks,
      caption,
      hashtags,
    };
  }

  private async generateImage(
    input: GeneratePostDto,
    content: GeneratedPayload,
  ): Promise<string | null> {
    if (!this.openai) {
      return null;
    }

    const hook = content.hooks[0] || '';
    const prompt = [
      'Create a clean, modern Instagram square image (no text overlay).',
      `Niche: ${input.niche}`,
      `Tone: ${input.tone}`,
      `Goal: ${input.goal}`,
      `Visual idea from hook: ${hook}`,
      `Caption context: ${content.caption}`,
      `Extra context: ${input.description || 'none'}`,
      'Style: cinematic lighting, social-media friendly composition, high contrast, premium aesthetic.',
    ].join('\n');

    const candidates = this.usingOpenRouter
      ? [
          this.imageModel,
          'google/gemini-2.5-flash-image',
          'google/gemini-3.1-flash-image-preview',
          'black-forest-labs/flux.2-flex',
        ]
      : [this.imageModel, 'dall-e-2', 'dall-e-3', 'gpt-image-1'];

    const uniqueModels = [...new Set(candidates.filter((m) => typeof m === 'string' && m.length > 0))];

    for (const model of uniqueModels) {
      try {
        if (this.usingOpenRouter) {
          const openRouterImageSize = this.imageSize === '1024x1024' ? '1K' : this.imageSize === '512x512' ? '0.5K' : '0.5K';

          const completion = await this.openai.chat.completions.create({
            model,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            // OpenRouter image generation uses modalities on chat completions.
            modalities: ['image', 'text'],
            image_config: {
              aspect_ratio: '1:1',
              image_size: openRouterImageSize,
            },
            max_tokens: 220,
          } as never);

          const message = completion.choices?.[0]?.message as {
            images?: Array<{ image_url?: { url?: string }; imageUrl?: { url?: string } }>;
            content?: unknown;
          };

          const generatedUrl = this.extractImageUrlFromOpenRouterMessage(message);
          if (generatedUrl) {
            return generatedUrl;
          }

          continue;
        }

        const result = await this.openai.images.generate({
          model,
          prompt,
          size: this.imageSize,
          n: 1,
        });

        const first = result.data?.[0] as { url?: string; b64_json?: string } | undefined;
        if (first?.url) {
          return first.url;
        }

        if (first?.b64_json) {
          return `data:image/png;base64,${first.b64_json}`;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown image generation error.';
        this.logger.warn(`Image generation failed on model '${model}': ${message}`);
      }
    }

    return null;
  }

  private extractImageUrlFromOpenRouterMessage(message: {
    images?: Array<{ image_url?: { url?: string }; imageUrl?: { url?: string } }>;
    content?: unknown;
  }): string | null {
    const fromImages = message.images?.[0]?.image_url?.url || message.images?.[0]?.imageUrl?.url;
    if (fromImages) {
      return fromImages;
    }

    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (!part || typeof part !== 'object') {
          continue;
        }

        const typedPart = part as {
          type?: string;
          image_url?: { url?: string };
          imageUrl?: { url?: string };
        };

        if (typedPart.type === 'image_url') {
          const maybeUrl = typedPart.image_url?.url || typedPart.imageUrl?.url;
          if (maybeUrl) {
            return maybeUrl;
          }
        }
      }
    }

    return null;
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
