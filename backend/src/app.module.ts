import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { BrandProfileModule } from './brand-profile/brand-profile.module';
import { DatabaseModule } from './database/database.module';
import { HistoryModule } from './history/history.module';
import { PlansModule } from './plans/plans.module';
import { TemplatesModule } from './templates/templates.module';
import { UsageModule } from './usage/usage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI', '');
        const configuredDbName = configService.get<string>('MONGODB_DB_NAME')?.trim();

        let dbName = configuredDbName;

        // If URI has no pathname DB segment, avoid MongoDB defaulting to "test".
        if (!dbName && uri) {
          try {
            const parsed = new URL(uri);
            const dbInUri = parsed.pathname.replace(/^\//, '').trim();
            if (!dbInUri) {
              dbName = 'instagram-post-generator';
            }
          } catch {
            dbName = 'instagram-post-generator';
          }
        }

        return {
          uri,
          ...(dbName ? { dbName } : {}),
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          bufferCommands: false,
          bufferTimeoutMS: 0,
          lazyConnection: true,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get<string>('THROTTLE_TTL_MS', '60000')),
          limit: Number(configService.get<string>('THROTTLE_LIMIT', '80')),
        },
      ],
    }),
    DatabaseModule,
    AdminModule,
    AuthModule,
    UsageModule,
    AiModule,
    PlansModule,
    BrandProfileModule,
    TemplatesModule,
    HistoryModule,
    PostModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
