import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({
  collection: 'plans',
  timestamps: true,
})
export class Plan {
  @Prop({ required: true, unique: true, trim: true, maxlength: 50 })
  name!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0 })
  creditLimit!: number;

  @Prop({ type: [String], default: [] })
  features!: string[];

  @Prop({ required: true, default: true })
  active!: boolean;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
