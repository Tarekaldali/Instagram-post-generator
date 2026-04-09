import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
export type UserRole = 'user' | 'admin';

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name!: string;

  @Prop({ required: true, trim: true, default: 'FREE' })
  plan!: string;

  @Prop({ required: true, default: 0, min: 0 })
  credits!: number;

  @Prop({ required: true, trim: true, default: 'user' })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  tokenVersion!: number;

  @Prop({ required: true, default: false })
  isEmailVerified!: boolean;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
