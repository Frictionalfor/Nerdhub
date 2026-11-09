import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { PinoLogger } from './common/logger/logger.service';
import { createServer as createHttpServer } from 'http';

let httpServer: ReturnType<typeof createHttpServer> | null = null;
let app: NestExpressApplication | null = null;
let isShuttingDown = false;

async function bootstrap(): Promise<void> {
  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const logger = app.get(PinoLogger);
  const port = config.get<number>('PORT') ?? 4000;
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';

  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: nodeEnv === 'production',
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter(logger));

  app.setGlobalPrefix('api/v1');

  const allowedOrigins = process.env.ALLOWED_ORIGINS ?? '';
  const origin =
    process.env.NODE_ENV !== 'production' && !allowedOrigins
      ? ['http://localhost:5173']
      : allowedOrigins.split(',').filter(Boolean);

  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-request-id'],
  });

  if (nodeEnv !== 'production') {
    const configDoc = new DocumentBuilder()
      .setTitle('NerdHub API')
      .setDescription('Versioned REST API for NerdHub (OpenAPI 3.1 contract source)')
      .setVersion('0.0.0-m0')
      .addServer(`http://localhost:${port}`, 'Local development')
      .build();
    const document = SwaggerModule.createDocument(app, configDoc);
    SwaggerModule.setup('docs', app, document);
  }

  httpServer = await app.listen(port);
  logger.log(`NerdHub API listening on port ${port} (${nodeEnv})`);
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  const logger = new PinoLogger('shutdown');
  logger.log(`Received ${signal}, shutting down gracefully`);

  let shutdownError: unknown = null;

  try {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    }
    if (app) {
      await app.close();
      logger.log('NestJS application closed');
    }
  } catch (error) {
    shutdownError = error;
    logger.error(error instanceof Error ? (error.stack ?? String(error)) : String(error));
  }

  // Exit with a non-zero code if cleanup failed so orchestrators can detect
  // unhealthy shutdowns, but never block indefinitely on cleanup.
  process.exit(shutdownError ? 1 : 0);
}

const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

for (const signal of signals) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

bootstrap().catch((error) => {
  const logger = new PinoLogger('bootstrap');
  logger.error(error instanceof Error ? (error.stack ?? String(error)) : String(error));
  process.exit(1);
});
