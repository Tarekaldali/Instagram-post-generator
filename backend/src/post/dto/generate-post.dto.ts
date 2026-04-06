import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const allowedTones = ['professional', 'funny', 'bold', 'aggressive'] as const;
export const allowedGoals = ['engagement', 'sales', 'followers'] as const;

export class GeneratePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  niche!: string;

  @IsString()
  @IsIn(allowedTones)
  tone!: (typeof allowedTones)[number];

  @IsString()
  @IsIn(allowedGoals)
  goal!: (typeof allowedGoals)[number];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;
}
