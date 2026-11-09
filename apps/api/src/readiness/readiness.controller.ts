import { Controller, Get, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import type { ReadinessResponse, ReadinessCheck } from '@nerdhub/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { PinoLogger } from '../common/logger/logger.service';
import Redis from 'ioredis';

@ApiTags('readiness')
@Controller('readiness')
export class ReadinessController implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    @Inject('REDIS_URL') private readonly redisUrl: string | undefined
  ) {}

  onModuleInit(): void {
    if (this.redisUrl) {
      this.redis = new Redis(this.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });
    }
  }

  @Get()
  @ApiOperation({ summary: 'Check API readiness (database + cache)' })
  @ApiOkResponse({ description: 'Readiness status' })
  async readiness(): Promise<ReadinessResponse> {
    const checks: ReadinessCheck[] = [];
    const start = process.hrtime.bigint();

    // Database check
    const dbStart = process.hrtime.bigint();
    let dbOk = false;
    let dbError: string | undefined;
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      dbOk = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : String(error);
    }
    checks.push({
      name: 'database',
      status: dbOk ? 'ok' : 'fail',
      latencyMs: Number(process.hrtime.bigint() - dbStart) / 1_000_000,
      ...(dbError ? { error: dbError } : {}),
    });

    // Redis check (optional)
    if (this.redis) {
      const redisStart = process.hrtime.bigint();
      let redisOk = false;
      let redisError: string | undefined;
      try {
        await this.redis.ping();
        redisOk = true;
      } catch (error) {
        redisError = error instanceof Error ? error.message : String(error);
      }
      checks.push({
        name: 'redis',
        status: redisOk ? 'ok' : 'fail',
        latencyMs: Number(process.hrtime.bigint() - redisStart) / 1_000_000,
        ...(redisError ? { error: redisError } : {}),
      });
    } else {
      checks.push({
        name: 'redis',
        status: 'ok',
        error: 'REDIS_URL not configured; cache readiness not checked',
      });
    }

    const allOk = checks.every((check) => check.status === 'ok');
    const status: 'ok' | 'degraded' = allOk ? 'ok' : 'degraded';

    this.logger.debug(
      `Readiness check completed in ${Number(process.hrtime.bigint() - start) / 1_000_000}ms (status=${status})`
    );

    return {
      status,
      service: 'api',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit();
  }
}
