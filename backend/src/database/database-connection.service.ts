import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseConnectionService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private isReady(): boolean {
    return this.connection.readyState === 1;
  }

  async ensureReadyOrThrow(operation: string, timeoutMs = 30000): Promise<void> {
    const ready = await this.waitUntilReady(timeoutMs);
    if (ready) {
      return;
    }

    throw new ServiceUnavailableException(
      `Database is still connecting. Please retry ${operation} in a moment.`,
    );
  }

  async waitUntilReady(timeoutMs = 30000): Promise<boolean> {
    if (this.isReady()) {
      return true;
    }

    try {
      const connected = await Promise.race<boolean>([
        this.connection
          .asPromise()
          .then(() => true)
          .catch(() => false),
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), timeoutMs);
        }),
      ]);

      return connected && this.isReady();
    } catch {
      return false;
    }
  }
}
