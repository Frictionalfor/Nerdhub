import { Queue, type QueueOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';

export const QUEUE_NAME = 'nerdhub';

/**
 * Job payloads. Keep payloads small and JSON-serializable; never include
 * secrets or raw user credentials.
 */
export interface PingJobData {
  message: string;
  echoBack?: boolean;
}

export type NerdHubJob = { name: 'ping'; data: PingJobData };

export function createRedisOptions(redisUrl: string): RedisOptions {
  return {
    enableAutoPipelining: true,
    lazyConnect: true,
    ...(redisUrl ? { url: redisUrl } : {}),
  };
}

export function createQueue(redisUrl: string, opts?: QueueOptions): Queue {
  return new Queue(QUEUE_NAME, {
    connection: createRedisOptions(redisUrl),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 50,
      ...opts?.defaultJobOptions,
    },
    ...opts,
  });
}
