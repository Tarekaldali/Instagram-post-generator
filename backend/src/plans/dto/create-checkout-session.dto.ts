import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsMongoId()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  successUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  cancelUrl?: string;
}
