import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import OpenAI from 'openai';
import { Connection, Model } from 'mongoose';
import { GeneratePostDto } from './dto/generate-post.dto';
import { GeneratedPost, GeneratedPostDocument } from './schemas/post.schema';

type GeneratedPayload = {
  hooks: string[];
  caption: string;
  hashtags: string[];
};

type OpenRouterMessage = {
  images?: Array<{
    image_url?: { url?: string };
    imageUrl?: { url?: string };
    url?: string;
  }>;
  content?: unknown;
};

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;
  private readonly textModelCandidates: string[];
  private readonly textMaxTokens: number;
  private readonly imageModel: string;
  private readonly imageModelCandidates: string[];
  private readonly imageSize: '256x256' | '512x512' | '1024x1024';
  private readonly imageMaxWaitMs: number;
  private readonly fallbackTextModel: string;
  private readonly fallbackImageBaseUrl: string;
  private readonly enableCreditFallback: boolean;
  private readonly usingOpenRouter: boolean;

  constructor(
    @InjectModel(GeneratedPost.name)
    private readonly postModel: Model<GeneratedPostDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {
    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
    const apiKey = openRouterKey || openAiKey;

    const explicitOpenRouterBaseUrl = this.configService.get<string>('OPENROUTER_BASE_URL');
    const inferOpenRouterFromKey = apiKey ? apiKey.startsWith('sk-or-') : false;
    this.usingOpenRouter = Boolean(openRouterKey || explicitOpenRouterBaseUrl || inferOpenRouterFromKey);

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

    this.textModelCandidates = this.parseModelList(
      this.configService.get<string>('OPENAI_TEXT_MODELS', ''),
      [this.model, this.usingOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'],
    );

    const configuredMaxTokens = Number(this.configService.get<string>('OPENAI_MAX_TOKENS', '800'));
    this.textMaxTokens = Number.isFinite(configuredMaxTokens)
      ? Math.min(Math.max(Math.floor(configuredMaxTokens), 200), 2500)
      : 800;

    this.imageModel = this.configService.get<string>(
      'OPENAI_IMAGE_MODEL',
      this.usingOpenRouter ? 'google/gemini-2.5-flash-image' : 'dall-e-2',
    );
    // To change the default image model, update OPENAI_IMAGE_MODEL in backend/.env.

    this.imageModelCandidates = this.parseModelList(
      this.configService.get<string>('OPENAI_IMAGE_MODELS', ''),
      this.usingOpenRouter
        ? [
            this.imageModel,
            'google/gemini-3.1-flash-image-preview-20260226',
            'google/gemini-2.5-flash-image',
          ]
        : [this.imageModel, 'dall-e-2', 'dall-e-3', 'gpt-image-1'],
    );
      // To control priority/fallback order, set OPENAI_IMAGE_MODELS in backend/.env (comma-separated).

    const configuredSize = this.configService.get<string>('OPENAI_IMAGE_SIZE', '512x512');
    this.imageSize =
      configuredSize === '256x256' || configuredSize === '1024x1024' ? configuredSize : '512x512';

    const configuredImageWait = Number(this.configService.get<string>('OPENAI_IMAGE_TIMEOUT_MS', '45000'));
    this.imageMaxWaitMs = Number.isFinite(configuredImageWait)
      ? Math.min(Math.max(Math.floor(configuredImageWait), 15000), 180000)
      : 45000;

    this.fallbackTextModel = this.configService.get<string>(
      'OPENAI_FALLBACK_TEXT_MODEL',
      'openai/gpt-oss-20b:free',
    );

    const configuredFallbackImageBase = this.configService.get<string>(
      'AI_FALLBACK_IMAGE_BASE_URL',
      'https://image.pollinations.ai/prompt',
    );
    this.fallbackImageBaseUrl = configuredFallbackImageBase.replace(/\/+$/, '');

    const enableFallbackRaw = this.configService.get<string>('ENABLE_CREDIT_FALLBACK', 'true');
    this.enableCreditFallback = enableFallbackRaw.toLowerCase() !== 'false';
  }

  async generate(input: GeneratePostDto) {
    const traceId = randomUUID();
    const startedAt = Date.now();

    if (!this.openai) {
      throw new BadRequestException(
        'API key is missing. Set OPENROUTER_API_KEY or OPENAI_API_KEY in backend environment.',
      );
    }

    this.logger.log(
      `[${traceId}] Generate start | niche=${input.niche} tone=${input.tone} goal=${input.goal} usingOpenRouter=${this.usingOpenRouter} textModel=${this.textModelCandidates[0]} textMaxTokens=${this.textMaxTokens} imageModel=${this.imageModelCandidates[0]} imageTimeoutMs=${this.imageMaxWaitMs} creditFallback=${this.enableCreditFallback}`,
    );

    const textPrompt = this.buildPrompt(input);
    const imagePromise = this.resolveImageWithTimeout(this.generateImage(input), traceId);

    try {
      this.logger.debug(`[${traceId}] Requesting text generation...`);

      const textRequest: Record<string, unknown> = {
        model: this.textModelCandidates[0],
        temperature: 0.9,
        max_tokens: this.textMaxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a world-class Instagram copywriter. Keep hooks short, emotional, and thumb-stopping. Never return generic AI-sounding phrases.',
          },
          {
            role: 'user',
            content: textPrompt,
          },
        ],
      };

      if (this.usingOpenRouter && this.textModelCandidates.length > 1) {
        textRequest.models = this.textModelCandidates;
        textRequest.route = 'fallback';
      }

      const textStartedAt = Date.now();
      let raw: string | null = null;

      try {
        const completion = await this.openai.chat.completions.create(textRequest as never);
        raw = completion.choices[0]?.message?.content ?? null;
      } catch (textError) {
        const textSummary = this.sanitizeSecrets(this.summarizeError(textError));
        this.logger.warn(`[${traceId}] Primary text model failed: ${textSummary}`);

        if (this.enableCreditFallback && this.isCreditError(textSummary)) {
          raw = await this.generateTextWithFreeFallback(textPrompt, traceId);
        } else {
          throw textError;
        }
      }

      if (!raw) {
        throw new InternalServerErrorException('OpenAI returned an empty response.');
      }

      this.logger.debug(
        `[${traceId}] Text generation complete. rawLength=${raw.length} elapsedMs=${Date.now() - textStartedAt}`,
      );

      const parsed = this.parsePayload(raw, input);
      this.logger.debug(
        `[${traceId}] Parsed payload | hooks=${parsed.hooks.length} hashtags=${parsed.hashtags.length} captionLength=${parsed.caption.length}`,
      );

      let imageUrl = await imagePromise;
      if (!imageUrl) {
        this.logger.warn(
          `[${traceId}] Image call without caption context returned no image. Retrying once with caption context.`,
        );
        imageUrl = await this.resolveImageWithTimeout(this.generateImage(input, parsed), traceId);
      }

      if (!imageUrl) {
        if (this.enableCreditFallback) {
          imageUrl = this.buildFallbackImageUrl(input, parsed, traceId);
        } else {
          throw new BadRequestException(
            `Image generation failed for configured model(s). Check OPENAI_IMAGE_MODEL, OPENAI_IMAGE_SIZE, and provider credits. (ref: ${traceId})`,
          );
        }
      }

      this.logger.debug(
        `[${traceId}] Image generation result | hasImage=${Boolean(imageUrl)} imagePrefix=${imageUrl.slice(0, 24)}`,
      );

      const fallbackResponse = {
        id: `unsaved-${traceId}`,
        niche: input.niche,
        tone: input.tone,
        goal: input.goal,
        description: input.description ?? '',
        caption: parsed.caption,
        imageUrl,
        hooks: parsed.hooks,
        hashtags: parsed.hashtags,
        createdAt: new Date(),
      };

      const dbState = this.connection.readyState;
      const dbStateLabel = this.describeDbState(dbState);
      const canPersist = await this.ensureDbConnected(traceId);

      this.logger.debug(
        `[${traceId}] MongoDB state before save | readyState=${dbState}(${dbStateLabel}) canPersist=${canPersist}`,
      );

      if (!canPersist) {
        this.logger.warn(
          `[${traceId}] MongoDB unavailable. Skipping save and returning generated content. elapsedMs=${Date.now() - startedAt}`,
        );
        return fallbackResponse;
      }

      this.logger.debug(`[${traceId}] Saving generated post to MongoDB...`);

      try {
        const post = await this.postModel.create({
          niche: input.niche,
          tone: input.tone,
          goal: input.goal,
          description: input.description ?? '',
          caption: parsed.caption,
          imageUrl,
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
      } catch (dbError) {
        this.logger.error(
          `[${traceId}] Mongo save failed. Returning unsaved generated content. ${this.summarizeError(dbError)} | elapsedMs=${Date.now() - startedAt}`,
        );
        return fallbackResponse;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.warn(`[${traceId}] BadRequestException: ${error.message}`);
        throw error;
      }

      const summary = this.summarizeError(error);
      const sanitized = this.sanitizeSecrets(summary);
      const lower = sanitized.toLowerCase();

      this.logger.error(`[${traceId}] Generate failed: ${sanitized}`);

      if (lower.includes('rate') && lower.includes('limit')) {
        throw new BadRequestException(`Rate limited by provider. Please retry shortly. (ref: ${traceId})`);
      }

      if (lower.includes('insufficient') || lower.includes('credits') || lower.includes('quota') || lower.includes('402')) {
        throw new BadRequestException(`Insufficient provider credits or quota. (ref: ${traceId})`);
      }

      if (lower.includes('incorrect api key') || (lower.includes('api key') && lower.includes('401'))) {
        throw new BadRequestException(
          this.usingOpenRouter
            ? `OpenRouter API key is invalid. Update OPENROUTER_API_KEY in backend environment. (ref: ${traceId})`
            : `OpenAI API key is invalid. Update OPENAI_API_KEY in backend environment. (ref: ${traceId})`,
        );
      }

      if (lower.includes('does not exist') && lower.includes('model')) {
        throw new BadRequestException(
          `Configured model is not available for this key. Update OPENAI_MODEL or OPENAI_IMAGE_MODEL. (ref: ${traceId})`,
        );
      }

      if (lower.includes('buffering timed out') || lower.includes('insertone')) {
        throw new InternalServerErrorException(
          `Database save timed out. Generated content may not be persisted. (ref: ${traceId})`,
        );
      }

      throw new InternalServerErrorException(
        `Failed to generate post content. Please try again. (ref: ${traceId})`,
      );
    }
  }

  async findAll() {
    const canRead = await this.ensureDbConnected('findAll');
    if (!canRead) {
      this.logger.warn(
        `Mongo read skipped in findAll because DB is not connected. readyState=${this.connection.readyState}(${this.describeDbState(this.connection.readyState)})`,
      );
      return [];
    }

    try {
      return await this.postModel.find().sort({ createdAt: -1 }).limit(50).lean();
    } catch (error) {
      this.logger.warn(`Mongo read failed in findAll. Returning empty list. ${this.summarizeError(error)}`);
      return [];
    }
  }

  getRuntimeStatus() {
    return {
      database: {
        readyState: this.connection.readyState,
        state: this.describeDbState(this.connection.readyState),
      },
      provider: {
        usingOpenRouter: this.usingOpenRouter,
        textModel: this.textModelCandidates[0],
        imageModel: this.imageModelCandidates[0],
      },
    };
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

  private parsePayload(raw: string, input: GeneratePostDto): GeneratedPayload {
    const parsed = this.tryParseGeneratedPayload(raw);
    if (!parsed) {
      throw new BadRequestException('Could not parse generated content from OpenAI.');
    }

    const hooks = this.normalizeHooks(parsed.hooks, input);
    const caption = this.normalizeCaption(parsed.caption, input);
    const hashtags = this.normalizeHashtags(parsed.hashtags, input);

    return {
      hooks,
      caption,
      hashtags,
    };
  }

  private async generateImage(input: GeneratePostDto, content?: GeneratedPayload): Promise<string | null> {
    if (!this.openai) {
      return null;
    }

    const hook = content?.hooks?.[0] || '';
    const prompt = [
      'Create a clean, modern Instagram square image (no text overlay).',
      `Niche: ${input.niche}`,
      `Tone: ${input.tone}`,
      `Goal: ${input.goal}`,
      `Visual idea from hook: ${hook || 'high-performing social content'}`,
      `Caption context: ${content?.caption || input.description || 'high engagement social post'}`,
      `Extra context: ${input.description || 'none'}`,
      'Style: cinematic lighting, social-media friendly composition, high contrast, premium aesthetic.',
    ].join('\n');

    if (this.usingOpenRouter) {
      try {
        const primary = this.imageModelCandidates[0];
        const openRouterImageSize = this.resolveOpenRouterImageSize(primary);

        const imageRequest: Record<string, unknown> = {
          model: primary,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          modalities: ['image', 'text'],
          image_config: {
            aspect_ratio: '1:1',
            image_size: openRouterImageSize,
          },
          max_tokens: 220,
        };

        if (this.imageModelCandidates.length > 1) {
          imageRequest.models = this.imageModelCandidates;
          imageRequest.route = 'fallback';
        }

        const completion = await this.openai.chat.completions.create(imageRequest as never);
        const message = completion.choices?.[0]?.message as OpenRouterMessage;
        const generatedUrl = this.extractImageUrlFromOpenRouterMessage(message);

        if (generatedUrl) {
          return generatedUrl;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown image generation error.';
        this.logger.warn(`Image generation failed via OpenRouter fallback route: ${message}`);
      }

      return null;
    }

    for (const model of this.imageModelCandidates) {
      try {
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

  private async resolveImageWithTimeout(imagePromise: Promise<string | null>, traceId: string): Promise<string | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.logger.warn(
          `[${traceId}] Image generation timed out after ${this.imageMaxWaitMs}ms. Proceeding without image from this attempt.`,
        );
        resolve(null);
      }, this.imageMaxWaitMs);

      imagePromise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(() => {
          clearTimeout(timer);
          resolve(null);
        });
    });
  }

  private parseModelList(raw: string, defaults: string[]): string[] {
    const parsed = raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const merged = parsed.length > 0 ? parsed : defaults;
    return [...new Set(merged)];
  }

  private isCreditError(summary: string): boolean {
    const lower = summary.toLowerCase();
    return (
      lower.includes('insufficient credits') ||
      lower.includes('insufficient provider credits') ||
      lower.includes('requires more credits') ||
      lower.includes('quota') ||
      lower.includes('payment required') ||
      lower.includes('status=402') ||
      lower.includes('code=402')
    );
  }

  private async generateTextWithFreeFallback(prompt: string, traceId: string): Promise<string> {
    this.logger.warn(
      `[${traceId}] Falling back to free text model '${this.fallbackTextModel}' due to insufficient credits on primary model.`,
    );

    const baseMessages = [
      {
        role: 'system' as const,
        content:
          'You are a world-class Instagram copywriter. Keep hooks short, emotional, and thumb-stopping. Never return generic AI-sounding phrases.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const attempts: Array<{ label: string; request: Record<string, unknown> }> = [
      {
        label: 'json-mode',
        request: {
          model: this.fallbackTextModel,
          temperature: 0.8,
          max_tokens: Math.min(this.textMaxTokens, 900),
          response_format: { type: 'json_object' },
          messages: baseMessages,
        },
      },
      {
        label: 'plain-json-prompt',
        request: {
          model: this.fallbackTextModel,
          temperature: 0.7,
          max_tokens: Math.min(this.textMaxTokens, 900),
          messages: [
            baseMessages[0],
            {
              role: 'user',
              content: `${prompt}\n\nReturn only a valid JSON object with keys hooks, caption, hashtags. Do not wrap JSON in markdown fences.`,
            },
          ],
        },
      },
    ];

    let lastErrorSummary = '';

    for (const attempt of attempts) {
      try {
        const completion = await this.openai!.chat.completions.create(attempt.request as never);
        const content = this.extractTextContentFromCompletion(completion);

        if (content) {
          this.logger.debug(
            `[${traceId}] Free fallback attempt '${attempt.label}' succeeded. rawLength=${content.length}`,
          );
          return content;
        }

        this.logger.warn(`[${traceId}] Free fallback attempt '${attempt.label}' returned empty content.`);
      } catch (error) {
        lastErrorSummary = this.sanitizeSecrets(this.summarizeError(error));
        this.logger.warn(
          `[${traceId}] Free fallback attempt '${attempt.label}' failed: ${lastErrorSummary}`,
        );
      }
    }

    const suffix = lastErrorSummary ? ` Last error: ${lastErrorSummary}` : '';
    throw new BadRequestException(
      `Free fallback text model did not return usable content. (ref: ${traceId})${suffix}`,
    );
  }

  private buildFallbackImageUrl(
    input: GeneratePostDto,
    content: GeneratedPayload,
    traceId: string,
  ): string {
    const promptText = [
      `${input.niche} instagram post`,
      `${input.tone} tone`,
      `${input.goal} goal`,
      content.hooks[0],
      input.description || 'high quality social media visual',
    ]
      .map((part) => this.toAsciiPromptPart(part))
      .filter(Boolean)
      .join(', ')
      .slice(0, 220);

    const prompt = encodeURIComponent(promptText);

    const seed = Date.now();
    const url = `${this.fallbackImageBaseUrl}/${prompt}?width=1024&height=1024&nologo=true&seed=${seed}`;

    this.logger.warn(
      `[${traceId}] Using fallback AI image provider because configured image models were unavailable/insufficient credits.`,
    );

    return url;
  }

  private resolveOpenRouterImageSize(model: string): '0.5K' | '1K' {
    const normalizedModel = model.toLowerCase();

    if (normalizedModel.includes('gemini-2.5-flash-image')) {
      return '1K';
    }

    if (normalizedModel.includes('gemini-3.1-flash-image-preview')) {
      return '0.5K';
    }

    return '1K';
  }

  private extractImageUrlFromOpenRouterMessage(message: OpenRouterMessage): string | null {
    const fromImages =
      message.images?.[0]?.image_url?.url ||
      message.images?.[0]?.imageUrl?.url ||
      message.images?.[0]?.url;

    if (fromImages) {
      return fromImages;
    }

    if (typeof message.content === 'string') {
      const dataMatch = message.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
      if (dataMatch?.[0]) {
        return dataMatch[0];
      }
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
          url?: string;
        };

        if (typedPart.type === 'image_url') {
          const maybeUrl = typedPart.image_url?.url || typedPart.imageUrl?.url || typedPart.url;
          if (maybeUrl) {
            return maybeUrl;
          }
        }
      }
    }

    return null;
  }

  private summarizeError(error: unknown): string {
    if (error instanceof Error) {
      const anyErr = error as {
        status?: number;
        code?: string;
        type?: string;
        error?: { message?: string; code?: string; type?: string };
        headers?: Record<string, string>;
        cause?: unknown;
      };

      const segments = [
        `${error.name}: ${error.message}`,
        anyErr.status ? `status=${anyErr.status}` : '',
        anyErr.code ? `code=${anyErr.code}` : '',
        anyErr.type ? `type=${anyErr.type}` : '',
        anyErr.error?.message ? `providerMessage=${anyErr.error.message}` : '',
        anyErr.error?.code ? `providerCode=${anyErr.error.code}` : '',
        anyErr.error?.type ? `providerType=${anyErr.error.type}` : '',
        anyErr.headers?.['x-request-id'] ? `requestId=${anyErr.headers['x-request-id']}` : '',
      ].filter(Boolean);

      if (anyErr.cause instanceof Error) {
        segments.push(`cause=${anyErr.cause.name}: ${anyErr.cause.message}`);
      }

      return segments.join(' | ');
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private sanitizeSecrets(message: string): string {
    return message
      .replace(/sk-[a-zA-Z0-9_-]{12,}/g, 'sk-***')
      .replace(/mongodb\+srv:\/\/[^\s]+/g, 'mongodb+srv://***');
  }

  private extractTextContentFromCompletion(completion: unknown): string | null {
    const choice = (completion as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0];
    const content = choice?.message?.content;

    if (typeof content === 'string') {
      const trimmed = content.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(content)) {
      const text = content
        .map((part) => {
          if (!part || typeof part !== 'object') {
            return '';
          }

          const typedPart = part as { type?: string; text?: string };
          if (typedPart.type === 'text' && typeof typedPart.text === 'string') {
            return typedPart.text;
          }

          return '';
        })
        .filter(Boolean)
        .join('\n')
        .trim();

      return text.length > 0 ? text : null;
    }

    return null;
  }

  private tryParseGeneratedPayload(raw: string): Partial<GeneratedPayload> | null {
    const queue = [...this.buildJsonCandidates(raw)];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const candidate = queue.shift();
      if (!candidate) {
        continue;
      }

      const normalizedCandidate = candidate.trim();
      if (!normalizedCandidate || seen.has(normalizedCandidate)) {
        continue;
      }

      seen.add(normalizedCandidate);

      try {
        const parsed = JSON.parse(normalizedCandidate) as unknown;

        if (typeof parsed === 'string') {
          const nested = parsed.trim();
          if (nested.length > 0) {
            queue.push(nested);
            const nestedObject = this.extractFirstJsonObject(nested);
            if (nestedObject) {
              queue.push(nestedObject);
            }
          }
          continue;
        }

        if (parsed && typeof parsed === 'object') {
          return parsed as Partial<GeneratedPayload>;
        }
      } catch {
        const embedded = this.extractFirstJsonObject(normalizedCandidate);
        if (embedded && !seen.has(embedded)) {
          queue.push(embedded);
        }
      }
    }

    return null;
  }

  private buildJsonCandidates(raw: string): string[] {
    const candidates = new Set<string>();
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }

    candidates.add(trimmed);

    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    if (withoutFence) {
      candidates.add(withoutFence);
    }

    const objectSlice = this.extractFirstJsonObject(trimmed);
    if (objectSlice) {
      candidates.add(objectSlice);
    }

    return [...candidates];
  }

  private extractFirstJsonObject(input: string): string | null {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaping = false;

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];

      if (inString) {
        if (escaping) {
          escaping = false;
          continue;
        }

        if (char === '\\') {
          escaping = true;
          continue;
        }

        if (char === '"') {
          inString = false;
        }

        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{') {
        if (depth === 0) {
          start = index;
        }
        depth += 1;
        continue;
      }

      if (char === '}') {
        if (depth > 0) {
          depth -= 1;
        }

        if (depth === 0 && start >= 0) {
          return input.slice(start, index + 1);
        }
      }
    }

    return null;
  }

  private normalizeHooks(hooks: unknown, input: GeneratePostDto): string[] {
    const fromModel = Array.isArray(hooks)
      ? hooks
          .map((hook) => this.cleanText(String(hook ?? '')))
          .filter((hook) => hook.length > 0)
      : [];

    const merged = [...new Set(fromModel)];
    for (const fallback of this.buildDefaultHooks(input)) {
      if (merged.length >= 5) {
        break;
      }

      if (!merged.includes(fallback)) {
        merged.push(fallback);
      }
    }

    return merged.slice(0, 5);
  }

  private normalizeCaption(caption: unknown, input: GeneratePostDto): string {
    const fromModel = typeof caption === 'string' ? this.cleanText(caption) : '';
    if (fromModel.length > 0) {
      return fromModel;
    }

    const niche = this.cleanText(input.niche || 'your niche');
    const goal = this.cleanText(input.goal || 'boost engagement');
    return `A quick idea for ${niche}: this post is designed to ${goal}. Save this for later and share it with someone who needs it.`;
  }

  private normalizeHashtags(hashtags: unknown, input: GeneratePostDto): string[] {
    const fromModel = Array.isArray(hashtags)
      ? hashtags
          .map((hashtag) => this.toHashtag(String(hashtag ?? '')))
          .filter((hashtag): hashtag is string => Boolean(hashtag))
      : [];

    const merged = [...new Set(fromModel)];

    for (const fallback of this.buildDefaultHashtags(input)) {
      if (merged.length >= 18) {
        break;
      }

      if (!merged.includes(fallback)) {
        merged.push(fallback);
      }
    }

    return merged.slice(0, 18);
  }

  private buildDefaultHooks(input: GeneratePostDto): string[] {
    const niche = this.cleanText(input.niche || 'your niche');
    const goal = this.cleanText(input.goal || 'grow faster');

    return [
      `This ${niche} tip changes everything`,
      `Try this before your next ${niche} post`,
      `The ${goal} move most people skip`,
      `Save this if you want better results`,
      `Use this today and thank yourself later`,
    ];
  }

  private buildDefaultHashtags(input: GeneratePostDto): string[] {
    const dynamic = `${input.niche} ${input.goal}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3)
      .slice(0, 6)
      .map((token) => `#${token}`);

    const defaults = [
      '#instagramtips',
      '#contentcreator',
      '#socialmediamarketing',
      '#growoninstagram',
      '#marketingstrategy',
      '#digitalmarketing',
      '#contentmarketing',
      '#smallbusinesstips',
      '#reelstips',
      '#onlinebusiness',
      '#brandstrategy',
      '#audiencegrowth',
    ];

    return [...new Set([...dynamic, ...defaults])];
  }

  private toHashtag(value: string): string | null {
    const normalized = this.cleanText(value)
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/[^a-z0-9_]/g, '');

    if (!normalized) {
      return null;
    }

    return `#${normalized}`;
  }

  private toAsciiPromptPart(value: string): string {
    return this.cleanText(value)
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^a-zA-Z0-9\s,-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isDbReady(): boolean {
    return this.connection.readyState === 1;
  }

  private async ensureDbConnected(traceId: string): Promise<boolean> {
    if (this.isDbReady()) {
      return true;
    }

    this.logger.warn(
      `[${traceId}] MongoDB not connected (state=${this.connection.readyState}:${this.describeDbState(this.connection.readyState)}). Attempting to connect...`,
    );

    try {
      const connected = await Promise.race<boolean>([
        this.connection
          .asPromise()
          .then(() => true)
          .catch(() => false),
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 1500);
        }),
      ]);

      if (!connected || !this.isDbReady()) {
        this.logger.warn(
          `[${traceId}] MongoDB connection not ready after quick attempt. state=${this.connection.readyState}(${this.describeDbState(this.connection.readyState)})`,
        );
        return false;
      }

      this.logger.log(`[${traceId}] MongoDB connection established.`);
      return true;
    } catch (error) {
      this.logger.warn(`[${traceId}] MongoDB connection attempt failed. ${this.summarizeError(error)}`);
      return false;
    }
  }

  private describeDbState(state: number): string {
    switch (state) {
      case 0:
        return 'disconnected';
      case 1:
        return 'connected';
      case 2:
        return 'connecting';
      case 3:
        return 'disconnecting';
      default:
        return 'unknown';
    }
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
