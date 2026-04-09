import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({
  collection: 'workspaces',
  timestamps: true,
})
export class Workspace {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerUserId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [] })
  members!: Types.ObjectId[];

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
