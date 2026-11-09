import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReadinessController } from './readiness.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [ReadinessController],
  providers: [
    {
      provide: 'REDIS_URL',
      useFactory: (config: ConfigService) => config.get<string>('REDIS_URL'),
      inject: [ConfigService],
    },
  ],
})
export class ReadinessModule {}
