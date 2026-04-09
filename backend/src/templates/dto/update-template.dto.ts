import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  hookTemplate?: string;

  @IsString()
  @MaxLength(3000)
  @IsOptional()
  captionTemplate?: string;

  @IsArray()
  @IsOptional()
  hashtagTemplate?: string[];
}
