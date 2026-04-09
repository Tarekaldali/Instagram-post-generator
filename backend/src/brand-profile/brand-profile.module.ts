import { Module } from '@nestjs/common';
import { BrandProfileController } from './brand-profile.controller';
import { BrandProfileService } from './brand-profile.service';

@Module({
  controllers: [BrandProfileController],
  providers: [BrandProfileService],
})
export class BrandProfileModule {}
