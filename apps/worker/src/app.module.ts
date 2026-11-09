import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvSchema, loadEnv, type Env } from './config/env';
import { LoggerModule } from './logger/logger.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      expandVariables: true,
      validate: (config: Record<string, unknown>) => EnvSchema.parse(config),
    }),
    LoggerModule,
    QueueModule,
  ],
})
export class AppModule {}

export { loadEnv, type Env };
