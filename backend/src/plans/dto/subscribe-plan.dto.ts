import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribePlanDto {
  @IsMongoId()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  paymentProviderId?: string;
}
