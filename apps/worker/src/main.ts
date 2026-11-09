import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule, loadEnv } from './app.module';
import { PinoLogger } from './logger/logger.service';
import { createServer as createHttpServer } from 'http';

let httpServer: ReturnType<typeof createHttpServer> | null = null;
let app: Awaited<ReturnType<typeof NestFactory.create>> | null = null;

async function bootstrap(): Promise<void> {
  loadEnv();
  const logger = new PinoLogger('bootstrap');

  app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: false,
  });

  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 0;
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  if (port > 0) {
    httpServer = await app.listen(port);
    logger.log(`NerdHub worker listening on port ${port} (${nodeEnv})`);
  } else {
    await app.init();
    logger.log(`NerdHub worker initialized (${nodeEnv})`);
  }
}

const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

for (const signal of signals) {
  process.on(signal, async () => {
    const logger = new PinoLogger('shutdown');
    logger.log(`Received ${signal}, shutting down gracefully`);
    try {
      if (httpServer) {
        await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
      }
      if (app) {
        await app.close();
        logger.log('NestJS application closed');
      }
    } catch (error) {
      logger.error(error instanceof Error ? (error.stack ?? String(error)) : String(error));
    }
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  const logger = new PinoLogger('bootstrap');
  logger.error(error instanceof Error ? (error.stack ?? String(error)) : String(error));
  process.exit(1);
});
