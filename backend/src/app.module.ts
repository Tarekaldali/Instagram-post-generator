import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', ''),
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        bufferCommands: false,
        bufferTimeoutMS: 0,
        lazyConnection: true,
      }),
    }),
    PostModule,
  ],
})
export class AppModule {}
