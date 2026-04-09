import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BrandProfileDocument = HydratedDocument<BrandProfile>;

@Schema({
  collection: 'brand_profiles',
  timestamps: true,
})
export class BrandProfile {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 140 })
  businessName!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  niche!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  tone!: string;

  @Prop({ required: true, trim: true, maxlength: 180 })
  targetAudience!: string;

  @Prop({ required: true, trim: true, maxlength: 180 })
  goal!: string;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const BrandProfileSchema = SchemaFactory.createForClass(BrandProfile);
