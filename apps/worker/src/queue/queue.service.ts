import { Injectable, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, type Job } from 'bullmq';
import { PinoLogger } from '../logger/logger.service';
import { createQueue, createRedisOptions, NerdHubJob, PingJobData, QUEUE_NAME } from './queue';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly pino = new PinoLogger('queue');
  private queue!: Queue;
  private worker!: Worker;
  private redis!: Redis;

  constructor(@Inject('REDIS_URL') private readonly redisUrl: string) {}

  async onModuleInit(): Promise<void> {
    this.redis = new Redis(createRedisOptions(this.redisUrl));
    this.queue = createQueue(this.redisUrl);

    this.worker = new Worker<NerdHubJob['data']>(QUEUE_NAME, this.handleJob.bind(this), {
      connection: createRedisOptions(this.redisUrl),
      concurrency: 5,
    });

    this.worker.on('completed', (job) => this.pino.log(`Job ${job.id} (${job.name}) completed`));
    this.worker.on('failed', (job, err) =>
      this.pino.error(
        `Job ${job?.id} (${job?.name}) failed: ${err?.stack ?? err}`,
        undefined,
        'queue'
      )
    );
    this.worker.on('error', (err) =>
      this.pino.error(`Worker error: ${err.stack ?? err}`, undefined, 'queue')
    );

    await this.ping();
    this.pino.log(`Worker listening on queue "${QUEUE_NAME}"`);
  }

  async onModuleDestroy(): Promise<void> {
    this.pino.log('Shutting down worker and queue');
    await this.worker?.close();
    await this.queue?.close();
    await this.redis?.quit();
  }

  async enqueue(data: PingJobData): Promise<string> {
    const job = await this.queue.add('ping', data);
    return job.id!;
  }

  private async handleJob(job: Job<PingJobData>): Promise<{ echoed: string }> {
    const { message, echoBack } = job.data;
    this.pino.debug(
      `Processing ping job (id=${job.id ?? '-'}, attempt=${job.attemptsMade})`,
      'queue'
    );

    if (!message || message.trim().length === 0) {
      throw new Error('ping message must not be empty');
    }

    const echoed = echoBack ? `echo: ${message}` : `pong: ${message}`;
    this.pino.log(`Ping job ${job.id} processed`);
    return { echoed };
  }

  private async ping(): Promise<void> {
    await this.redis.ping();
  }
}
