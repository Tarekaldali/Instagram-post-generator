import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UsageLogDocument = HydratedDocument<UsageLog>;

@Schema({
  collection: 'usage_logs',
  timestamps: true,
})
export class UsageLog {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  action!: string;

  @Prop({ required: true, default: 0, min: 0 })
  creditsUsed!: number;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const UsageLogSchema = SchemaFactory.createForClass(UsageLog);
