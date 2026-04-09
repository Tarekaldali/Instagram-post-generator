import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateAiImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1800)
  prompt!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  style?: string;
}
