import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('worker env validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'info';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('parses a valid environment', async () => {
    // Dynamic import so env vars are set before AppModule/ConfigModule loads.
    const { loadEnv } = await import('./app.module');
    const env = loadEnv();
    expect(env.NODE_ENV).toBe('test');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.REDIS_URL).toBe('redis://localhost:6379');
    expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/test');
    expect(env.WORKER_CONCURRENCY).toBe(5);
  });
});
