import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { GeneratePostDto } from './dto/generate-post.dto';
import { PostService } from './post.service';

const DEFAULT_IMAGE_PROXY_ALLOWED_HOSTS = [
  'image.pollinations.ai',
  'openrouter.ai',
  'oaistatic.com',
  'oaiusercontent.com',
];

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  getApiInfo() {
    return {
      service: 'Instagram Post Generator API',
      status: 'ok',
      endpoints: {
        generate: 'POST /generate',
        posts: 'GET /posts',
        imageProxy: 'GET /image-proxy?url=<encoded_image_url>',
      },
      runtime: this.postService.getRuntimeStatus(),
    };
  }

  @Get('image-proxy')
  async imageProxy(@Query('url') rawUrl: string, @Res() res: any) {
    if (!rawUrl) {
      throw new BadRequestException('Query parameter "url" is required.');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid image URL.');
    }

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new BadRequestException('Only http/https image URLs are allowed.');
    }

    const allowedHosts = this.getImageProxyAllowedHosts();
    if (!this.isImageHostAllowed(parsedUrl.hostname, allowedHosts)) {
      throw new BadRequestException(`Image host '${parsedUrl.hostname}' is not allowed.`);
    }

    let upstreamResponse: globalThis.Response;
    try {
      upstreamResponse = await fetch(parsedUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'InstagramPostGenerator/1.0',
        },
      });
    } catch {
      throw new BadGatewayException('Failed to fetch image from upstream provider.');
    }

    if (!upstreamResponse.ok) {
      throw new BadGatewayException(`Upstream image provider returned HTTP ${upstreamResponse.status}.`);
    }

    const contentType = upstreamResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(imageBuffer);
  }

  @Post('generate')
  async generatePost(@Body() generatePostDto: GeneratePostDto) {
    return this.postService.generate(generatePostDto);
  }

  @Get('posts')
  async getPosts() {
    return this.postService.findAll();
  }

  private getImageProxyAllowedHosts(): string[] {
    const configured = process.env.IMAGE_PROXY_ALLOWED_HOSTS;
    if (!configured || configured.trim().length === 0) {
      return DEFAULT_IMAGE_PROXY_ALLOWED_HOSTS;
    }

    const hosts = configured
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter((host) => host.length > 0);

    return hosts.length > 0 ? hosts : DEFAULT_IMAGE_PROXY_ALLOWED_HOSTS;
  }

  private isImageHostAllowed(hostname: string, allowedHosts: string[]): boolean {
    const normalizedHost = hostname.toLowerCase();
    return allowedHosts.some(
      (allowedHost) =>
        normalizedHost === allowedHost || normalizedHost.endsWith(`.${allowedHost}`),
    );
  }
}
