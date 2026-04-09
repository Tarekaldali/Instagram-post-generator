import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(500)
  hookTemplate!: string;

  @IsString()
  @MaxLength(3000)
  captionTemplate!: string;

  @IsArray()
  @IsOptional()
  hashtagTemplate?: string[];

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
