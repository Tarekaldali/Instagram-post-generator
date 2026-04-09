import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({
  collection: 'templates',
  timestamps: true,
})
export class Template {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  hookTemplate!: string;

  @Prop({ required: true, trim: true, maxlength: 3000 })
  captionTemplate!: string;

  @Prop({ type: [String], default: [] })
  hashtagTemplate!: string[];

  @Prop({ required: true, default: false })
  isSystem!: boolean;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
