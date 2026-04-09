import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseConnectionService } from '../database/database-connection.service';
import {
  ImageGeneration,
  ImageGenerationDocument,
  Plan,
  PlanDocument,
  PostRecord,
  PostRecordDocument,
  Subscription,
  SubscriptionDocument,
  User,
  UserDocument,
  Workspace,
  WorkspaceDocument,
} from '../database/schemas';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(PostRecord.name)
    private readonly postRecordModel: Model<PostRecordDocument>,
    @InjectModel(ImageGeneration.name)
    private readonly imageGenerationModel: Model<ImageGenerationDocument>,
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  async getOverview() {
    await this.databaseConnectionService.ensureReadyOrThrow('loading the admin overview');

    const [userCount, planCount, generationCount, imageGenerationCount] = await Promise.all([
      this.userModel.countDocuments(),
      this.planModel.countDocuments(),
      this.postRecordModel.countDocuments(),
      this.imageGenerationModel.countDocuments(),
    ]);

    return {
      userCount,
      planCount,
      generationCount,
      imageGenerationCount,
    };
  }

  async listUsers() {
    await this.databaseConnectionService.ensureReadyOrThrow('loading users');

    const [users, workspaces] = await Promise.all([
      this.userModel.find().sort({ createdAt: -1 }).lean(),
      this.workspaceModel.find().lean(),
    ]);

    const workspaceNames = new Map(
      workspaces.map((workspace) => [workspace._id.toString(), workspace.name]),
    );

    return users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role ?? 'user',
      plan: user.plan,
      credits: user.credits,
      workspaceId: user.workspaceId.toString(),
      workspaceName: workspaceNames.get(user.workspaceId.toString()) ?? 'Workspace',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async listPlans() {
    await this.databaseConnectionService.ensureReadyOrThrow('loading plans');

    const [plans, subscriptions] = await Promise.all([
      this.planModel.find().sort({ price: 1 }).lean(),
      this.subscriptionModel.find().lean(),
    ]);

    const subscriberCounts = subscriptions.reduce<Map<string, number>>((accumulator, subscription) => {
      const key = subscription.planId.toString();
      accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

    return plans.map((plan) => ({
      id: plan._id.toString(),
      name: plan.name,
      price: plan.price,
      creditLimit: plan.creditLimit,
      features: plan.features,
      active: plan.active,
      subscriberCount: subscriberCounts.get(plan._id.toString()) ?? 0,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));
  }

  async listGenerations() {
    await this.databaseConnectionService.ensureReadyOrThrow('loading generations');

    const generations = await this.postRecordModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const userIds = [...new Set(generations.map((generation) => generation.userId.toString()))];
    const users = await this.userModel.find({ _id: { $in: userIds } }).lean();
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));

    return generations.map((generation) => {
      const user = usersById.get(generation.userId.toString());

      return {
        id: generation._id.toString(),
        userId: generation.userId.toString(),
        userName: user?.name ?? 'Unknown User',
        userEmail: user?.email ?? '',
        workspaceId: generation.workspaceId.toString(),
        hook: generation.hook,
        caption: generation.caption,
        hashtags: generation.hashtags,
        imageUrl: generation.imageUrl,
        status: generation.status,
        optimizedPrompt: generation.optimizedPrompt,
        createdAt: generation.createdAt,
      };
    });
  }
}
