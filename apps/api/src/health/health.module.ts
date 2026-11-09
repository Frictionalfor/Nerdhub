import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [HealthController],
})
export class HealthModule {}
