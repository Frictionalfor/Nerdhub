import { describe, expect, it } from 'vitest';
import type { HealthResponse } from './health.js';

describe('health contract', () => {
  it('defines an ok health response shape', () => {
    const response: HealthResponse = {
      status: 'ok',
      service: 'api',
      version: '0.0.0-m0',
      environment: 'test',
      timestamp: new Date().toISOString(),
    };

    expect(response.status).toBe('ok');
    expect(response.service).toBe('api');
    expect(response.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
