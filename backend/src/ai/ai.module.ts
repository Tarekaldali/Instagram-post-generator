import { Module } from '@nestjs/common';
import { PostModule } from '../post/post.module';
import { UsageModule } from '../usage/usage.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [PostModule, UsageModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
