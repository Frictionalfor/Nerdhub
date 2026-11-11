import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthModule } from './health.module';
import { ResponseEnvelopeInterceptor } from '../common/interceptors/response-envelope.interceptor';

/**
 * Integration tests for the standard API response envelope (MED-03).
 *
 * Verifies that successful responses are wrapped in { data, meta: { requestId } },
 * the X-Request-Id response header is set, and health semantics are preserved
 * inside the envelope.
 *
 * Uses a minimal module (HealthModule only) with the interceptor registered via
 * useGlobalInterceptors, so the test does not require a live database or the
 * full AppModule (which pulls in Prisma).
 */
describe('Response envelope (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // Register the interceptor with a minimal config mock; REQUEST_ID_HEADER is
    // optional and defaults to 'x-request-id' when absent.
    app.useGlobalInterceptors(
      new ResponseEnvelopeInterceptor({ get: () => undefined } as unknown as never)
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps a successful health response in the standard envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');

    const body = res.body;
    expect(body).toEqual({
      data: {
        status: 'ok',
        service: 'api',
        version: expect.any(String),
        environment: expect.any(String),
        timestamp: expect.any(String),
      },
      meta: {
        requestId: res.headers['x-request-id'],
      },
    });
  });

  it('propagates a client-supplied x-request-id through meta and header', async () => {
    const clientId = 'integration-test-request-id';
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', clientId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(clientId);

    const body = res.body;
    expect(body.meta.requestId).toBe(clientId);
    expect(body.data.status).toBe('ok');
  });
});
