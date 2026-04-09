import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { BrandProfileService } from './brand-profile.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('brand-profile')
export class BrandProfileController {
  constructor(private readonly brandProfileService: BrandProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.brandProfileService.getProfile(user);
  }

  @Put()
  async upsertProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpsertBrandProfileDto,
  ) {
    return this.brandProfileService.upsertProfile(user, input);
  }
}
