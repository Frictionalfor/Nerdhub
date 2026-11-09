import { Module } from '@nestjs/common';
import { ConfigRootModule } from './config/config.module';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ReadinessModule } from './readiness/readiness.module';

@Module({
  imports: [ConfigRootModule, LoggerModule, PrismaModule, HealthModule, ReadinessModule],
})
export class AppModule {}
