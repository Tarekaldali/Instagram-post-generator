import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostRecordDocument = HydratedDocument<PostRecord>;

@Schema({
  collection: 'posts',
  timestamps: true,
})
export class PostRecord {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 220 })
  hook!: string;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  caption!: string;

  @Prop({ type: [String], required: true, default: [] })
  hashtags!: string[];

  @Prop({ trim: true, default: '' })
  imageUrl!: string;

  @Prop({ required: true, trim: true, default: 'draft' })
  status!: 'draft' | 'scheduled' | 'published';

  @Prop({ trim: true, default: '' })
  optimizedPrompt!: string;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const PostRecordSchema = SchemaFactory.createForClass(PostRecord);
