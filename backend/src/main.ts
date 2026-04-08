import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const isMongoConnectionFailure = (value: unknown): boolean => {
  if (!(value instanceof Error)) {
    return false;
  }

  const message = value.message.toLowerCase();
  return (
    message.includes('mongoserverselectionerror') ||
    message.includes('unable to connect to the database') ||
    message.includes('tlsv1 alert internal error') ||
    message.includes('server selection timed out') ||
    (message.includes('querytxt') && message.includes('etimeout')) ||
    (message.includes('dns') && message.includes('timeout')) ||
    message.includes('mongodb.net')
  );
};

process.on('uncaughtException', (error) => {
  if (isMongoConnectionFailure(error)) {
    console.error('[MongoDB] Uncaught connection error intercepted. API will stay up, but DB operations may fail.');
    console.error(error.message);
    return;
  }

  console.error('[Fatal] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (isMongoConnectionFailure(reason)) {
    const error = reason as Error;
    console.error('[MongoDB] Unhandled rejection intercepted. API will stay up, but DB operations may fail.');
    console.error(error.message);
    return;
  }

  console.error('[Fatal] Unhandled rejection:', reason);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);

  console.log(`Instagram Post Generator API running on http://localhost:${port}`);
}

bootstrap();
