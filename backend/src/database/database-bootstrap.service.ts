import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  BrandProfile,
  ImageGeneration,
  Plan,
  PostRecord,
  Subscription,
  Template,
  UsageLog,
  User,
  Workspace,
} from './schemas';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBootstrapService.name);
  private readonly requiredModelNames = [
    Workspace.name,
    User.name,
    BrandProfile.name,
    PostRecord.name,
    ImageGeneration.name,
    UsageLog.name,
    Plan.name,
    Subscription.name,
    Template.name,
  ];

  private didEnsureCollections = false;
  private ensureInFlight: Promise<void> | null = null;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onApplicationBootstrap() {
    this.connection.on('connected', () => {
      void this.ensureCollectionsSafely('connected-event');
    });

    await this.ensureCollectionsSafely('app-bootstrap');
  }

  private async ensureCollectionsSafely(trigger: string) {
    if (this.didEnsureCollections) {
      return;
    }

    if (this.ensureInFlight) {
      await this.ensureInFlight;
      return;
    }

    this.ensureInFlight = (async () => {
      const dbReady = await this.ensureDbConnected();
      if (!dbReady) {
        this.logger.warn(
          `Skipped collection bootstrap (${trigger}) because MongoDB is not connected yet.`,
        );
        return;
      }

      for (const modelName of this.requiredModelNames) {
        const model = this.connection.models[modelName];
        if (!model) {
          this.logger.warn(`Model '${modelName}' not registered when bootstrapping collections.`);
          continue;
        }

        try {
          await model.createCollection();
        } catch (error) {
          if (this.isAlreadyExistsError(error)) {
            continue;
          }

          this.logger.warn(
            `Failed to ensure collection for model '${modelName}': ${this.summarizeError(error)}`,
          );
        }
      }

      this.didEnsureCollections = true;
      this.logger.log(`MongoDB collections ensured for database '${this.connection.name}'.`);
    })();

    try {
      await this.ensureInFlight;
    } finally {
      this.ensureInFlight = null;
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
          setTimeout(() => resolve(false), 2000);
        }),
      ]);

      return connected;
    } catch {
      return false;
    }
  }

  private isAlreadyExistsError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { codeName?: string; message?: string };
    const message = maybeError.message?.toLowerCase() ?? '';

    return maybeError.codeName === 'NamespaceExists' || message.includes('already exists');
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
