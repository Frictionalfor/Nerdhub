import { Module } from '@nestjs/common';
import { PinoLogger } from './logger.service';

@Module({
  providers: [{ provide: PinoLogger, useClass: PinoLogger }],
  exports: [PinoLogger],
})
export class LoggerModule {}
