import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ImageGenerationDocument = HydratedDocument<ImageGeneration>;

@Schema({
  collection: 'image_generations',
  timestamps: true,
})
export class ImageGeneration {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  prompt!: string;

  @Prop({ required: true, trim: true, maxlength: 80 })
  model!: string;

  @Prop({ required: true, trim: true })
  imageUrl!: string;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const ImageGenerationSchema = SchemaFactory.createForClass(ImageGeneration);
