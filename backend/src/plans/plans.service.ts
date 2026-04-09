import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import {
  Plan,
  PlanDocument,
  Subscription,
  SubscriptionDocument,
  User,
  UserDocument,
} from '../database/schemas';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SubscribePlanDto } from './dto/subscribe-plan.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { DEFAULT_PLANS, FREE_PLAN } from './default-plans';

@Injectable()
export class PlansService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlansService.name);
  private didSeedDefaultPlans = false;
  private seedInFlight: Promise<void> | null = null;

  constructor(
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async onApplicationBootstrap() {
    this.connection.on('connected', () => {
      void this.ensureDefaultPlansInitialized('connected-event');
    });

    await this.ensureDefaultPlansInitialized('app-bootstrap');
  }

  async listPlans() {
    await this.ensureDefaultPlansInitialized('list-plans');
    return this.planModel.find({ active: true }).sort({ price: 1 }).lean();
  }

  async getCurrentSubscription(user: AuthenticatedUser) {
    return this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      })
      .populate('planId')
      .lean();
  }

  async subscribe(user: AuthenticatedUser, input: SubscribePlanDto) {
    await this.ensureDefaultPlansInitialized('subscribe');

    const plan = await this.planModel.findOne({
      _id: new Types.ObjectId(input.planId),
      active: true,
    });

    if (!plan) {
      throw new BadRequestException('Requested plan does not exist or is inactive.');
    }

    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    const subscription = await this.subscriptionModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      },
      {
        $set: {
          planId: plan._id,
          status: 'active',
          renewalDate,
          paymentProviderId: input.paymentProviderId ?? '',
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    await this.userModel.findByIdAndUpdate(user.userId, {
      $set: {
        plan: plan.name,
        credits: plan.creditLimit,
      },
    });

    return {
      subscriptionId: subscription._id.toString(),
      plan: plan.name,
      creditLimit: plan.creditLimit,
      renewalDate,
      status: 'active',
    };
  }

  async cancel(user: AuthenticatedUser) {
    const subscription = await this.subscriptionModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(user.userId),
        workspaceId: new Types.ObjectId(user.workspaceId),
      },
      {
        $set: {
          status: 'canceled',
        },
      },
      {
        new: true,
      },
    );

    if (!subscription) {
      throw new BadRequestException('No active subscription found for this user.');
    }

    await this.userModel.findByIdAndUpdate(user.userId, {
      $set: {
        plan: FREE_PLAN.name,
        credits: FREE_PLAN.creditLimit,
      },
    });

    return {
      success: true,
      status: subscription.status,
    };
  }

  async createCheckoutSessionStub(
    user: AuthenticatedUser,
    input: CreateCheckoutSessionDto,
  ) {
    await this.ensureDefaultPlansInitialized('checkout-session');

    const plan = await this.planModel.findOne({
      _id: new Types.ObjectId(input.planId),
      active: true,
    });

    if (!plan) {
      throw new BadRequestException('Requested plan does not exist or is inactive.');
    }

    return {
      provider: 'stripe',
      mode: 'subscription',
      status: 'stub',
      message:
        'Implement Stripe SDK call here: create checkout session with plan metadata and webhook verification.',
      payloadTemplate: {
        customerReference: user.userId,
        workspaceReference: user.workspaceId,
        planId: plan._id.toString(),
        successUrl: input.successUrl ?? '',
        cancelUrl: input.cancelUrl ?? '',
      },
    };
  }

  async ensureDefaultPlansInitialized(trigger: string) {
    await this.ensureDefaultPlansSafely(trigger);
  }

  private async ensureDefaultPlans() {
    await this.planModel.bulkWrite(
      DEFAULT_PLANS.map((plan) => ({
        updateOne: {
          filter: { name: plan.name },
          update: {
            $set: {
              price: plan.price,
              creditLimit: plan.creditLimit,
              features: plan.features,
              active: true,
            },
            $setOnInsert: {
              name: plan.name,
            },
          },
          upsert: true,
        },
      })),
    );
  }

  private async ensureDefaultPlansSafely(trigger: string) {
    if (this.didSeedDefaultPlans) {
      return;
    }

    if (this.seedInFlight) {
      await this.seedInFlight;
      return;
    }

    this.seedInFlight = (async () => {
      const dbReady = await this.ensureDbConnected();
      if (!dbReady) {
        this.logger.warn(
          `Skipping default plan seed (${trigger}) because MongoDB is not connected yet.`,
        );
        return;
      }

      try {
        await this.ensureDefaultPlans();
        this.didSeedDefaultPlans = true;
        this.logger.log(
          `Default plans ensured for database '${this.connection.name}' (${trigger}).`,
        );
      } catch (error) {
        this.logger.warn(`Default plan seed failed: ${this.summarizeError(error)}`);
      }
    })();

    try {
      await this.seedInFlight;
    } finally {
      this.seedInFlight = null;
    }
  }

  private async ensureDbConnected(): Promise<boolean> {
    if (this.connection.readyState === 1) {
      return true;
    }

    try {
      const connected = await Promise.race<boolean>([
        this.connection
          .asPromise()
          .then(() => true)
          .catch(() => false),
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 1500);
        }),
      ]);

      return connected;
    } catch {
      return false;
    }
  }

  private summarizeError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
