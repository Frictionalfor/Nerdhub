import { Module } from '@nestjs/common';
import { PinoLogger } from './logger.service';

@Module({
  providers: [
    {
      provide: PinoLogger,
      useFactory: () => new PinoLogger('api'),
    },
  ],
  exports: [PinoLogger],
})
export class LoggerModule {}
