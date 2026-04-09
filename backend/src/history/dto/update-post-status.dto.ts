import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['draft', 'scheduled', 'published'])
  status!: 'draft' | 'scheduled' | 'published';
}
