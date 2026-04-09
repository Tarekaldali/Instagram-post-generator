import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UsageService } from './usage.service';

@UseGuards(JwtAuthGuard)
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('credits')
  async getCredits(@CurrentUser() user: AuthenticatedUser) {
    return this.usageService.getCredits(user.userId);
  }

  @Get('logs')
  async getLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 20;
    return this.usageService.getUsageLogs(user.userId, user.workspaceId, parsedLimit);
  }
}
