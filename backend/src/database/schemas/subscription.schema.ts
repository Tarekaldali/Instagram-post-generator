import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Plan } from './plan.schema';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({
  collection: 'subscriptions',
  timestamps: true,
})
export class Subscription {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: Plan.name })
  planId!: Types.ObjectId;

  @Prop({ required: true, trim: true, default: 'active' })
  status!: 'active' | 'trialing' | 'past_due' | 'canceled';

  @Prop({ required: true })
  renewalDate!: Date;

  @Prop({ trim: true, default: '' })
  paymentProviderId!: string;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
