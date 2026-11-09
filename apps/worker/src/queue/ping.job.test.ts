import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import { Queue, Worker } from 'bullmq';
import { createRedisOptions, type PingJobData, QUEUE_NAME } from './queue';

/**
 * Integration test for the example `ping` job.
 *
 * Verifies the BullMQ queue can enqueue and process a job against a real
 * Redis instance. The handler validates input and is safe to retry
 * (BullMQ retries with exponential backoff). Requires REDIS_URL to point at
 * a running Redis (Docker Compose in development, service in CI).
 */
describe('ping job processing', () => {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  let queue: Queue;
  let worker: Worker<PingJobData>;
  let result: { echoed: string } | null = null;

  beforeAll(async () => {
    const connection = createRedisOptions(redisUrl);
    queue = new Queue(QUEUE_NAME, { connection });

    worker = new Worker<PingJobData>(
      QUEUE_NAME,
      async (job) => {
        const { message, echoBack } = job.data;
        if (!message || message.trim().length === 0) {
          throw new Error('ping message must not be empty');
        }
        result = {
          echoed: echoBack ? `echo: ${message}` : `pong: ${message}`,
        };
        return result;
      },
      { connection }
    );

    await new Promise<void>((resolve, reject) => {
      worker.once('ready', resolve);
      worker.once('failed', reject);
    });
  });

  afterAll(async () => {
    await queue?.close();
    await worker?.close();
  });

  it('processes a ping job and echoes the message', async () => {
    result = null;
    await queue.add('ping', { message: 'hello', echoBack: true });

    let elapsed = 0;
    while (!result && elapsed < 10_000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      elapsed += 100;
    }

    expect(result).toEqual({ echoed: 'echo: hello' });
  });

  it('rejects an empty message so BullMQ can retry it', async () => {
    result = null;
    const job = await queue.add('ping', { message: '' });

    let failed = false;
    let attempts = 0;
    const done = new Promise<void>((resolve) => {
      worker.once('failed', (_job, _err) => {
        failed = true;
        attempts = (_job?.attemptsMade ?? 0) + 1;
        resolve();
      });
    });

    await job;
    await done;

    expect(failed).toBe(true);
    expect(attempts).toBeGreaterThanOrEqual(1);
  });
});
