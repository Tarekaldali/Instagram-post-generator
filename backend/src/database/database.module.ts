import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BrandProfile,
  BrandProfileSchema,
  ImageGeneration,
  ImageGenerationSchema,
  Plan,
  PlanSchema,
  PostRecord,
  PostRecordSchema,
  Subscription,
  SubscriptionSchema,
  Template,
  TemplateSchema,
  UsageLog,
  UsageLogSchema,
  User,
  UserSchema,
  Workspace,
  WorkspaceSchema,
} from './schemas';
import { DatabaseConnectionService } from './database-connection.service';
import { DatabaseBootstrapService } from './database-bootstrap.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
      { name: BrandProfile.name, schema: BrandProfileSchema },
      { name: PostRecord.name, schema: PostRecordSchema },
      { name: ImageGeneration.name, schema: ImageGenerationSchema },
      { name: UsageLog.name, schema: UsageLogSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
  ],
  providers: [DatabaseBootstrapService, DatabaseConnectionService],
  exports: [MongooseModule, DatabaseConnectionService],
})
export class DatabaseModule {}
