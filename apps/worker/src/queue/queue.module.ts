import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    QueueService,
    {
      provide: 'REDIS_URL',
      useFactory: (config: ConfigService) => config.get<string>('REDIS_URL'),
      inject: [ConfigService],
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
