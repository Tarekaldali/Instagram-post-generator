import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertBrandProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  niche!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  tone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  targetAudience!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  goal!: string;
}
