import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AiService } from './ai.service';
import { GenerateAiImageDto } from './dto/generate-ai-image.dto';
import { GenerateAiPostDto } from './dto/generate-ai-post.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-post')
  async generatePost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: GenerateAiPostDto,
  ) {
    return this.aiService.generatePost(user, input);
  }

  @Post('generate-image')
  async generateImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: GenerateAiImageDto,
  ) {
    return this.aiService.generateImage(user, input);
  }
}
