import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GenerateAiPostDto {
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
  goal!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1200)
  description?: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;
}
