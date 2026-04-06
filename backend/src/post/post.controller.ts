import { Body, Controller, Get, Post } from '@nestjs/common';
import { GeneratePostDto } from './dto/generate-post.dto';
import { PostService } from './post.service';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('generate')
  async generatePost(@Body() generatePostDto: GeneratePostDto) {
    return this.postService.generate(generatePostDto);
  }

  @Get('posts')
  async getPosts() {
    return this.postService.findAll();
  }
}
