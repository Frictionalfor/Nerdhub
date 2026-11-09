import { ValidationPipe } from '@nestjs/common';
import { z } from 'zod';

/**
 * NestJS validation pipeline that coerces and validates env against the zod
 * schema used by ConfigModule.
 */
export const validationPipeline = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});

export { z };
