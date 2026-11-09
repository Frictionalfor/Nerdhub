import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import type { HealthResponse } from '@nerdhub/contracts';
import { PinoLogger } from '../common/logger/logger.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly logger: PinoLogger) {}

  @Get()
  @ApiOperation({ summary: 'Check API liveness' })
  @ApiOkResponse({ description: 'API is up' })
  health(): HealthResponse {
    this.logger.debug('Health check requested');
    return {
      status: 'ok',
      service: 'api',
      version: process.env.npm_package_version ?? '0.0.0-m0',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
