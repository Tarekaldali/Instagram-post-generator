import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GeneratedPostDocument = HydratedDocument<GeneratedPost>;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
})
export class GeneratedPost {
  @Prop({ required: true, trim: true })
  niche!: string;

  @Prop({ required: true, trim: true })
  tone!: string;

  @Prop({ required: true, trim: true })
  goal!: string;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ required: true })
  caption!: string;

  @Prop({ trim: true, default: '' })
  imageUrl?: string;

  @Prop({ type: [String], required: true })
  hooks!: string[];

  @Prop({ type: [String], required: true })
  hashtags!: string[];

  @Prop({ type: Date })
  createdAt!: Date;
}

export const GeneratedPostSchema = SchemaFactory.createForClass(GeneratedPost);
