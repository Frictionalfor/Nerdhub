import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigRootModule } from './config/config.module';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ReadinessModule } from './readiness/readiness.module';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

@Module({
  imports: [ConfigRootModule, LoggerModule, PrismaModule, HealthModule, ReadinessModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
