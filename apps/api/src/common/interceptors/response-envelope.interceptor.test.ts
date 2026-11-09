import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

/**
 * Unit tests for ResponseEnvelopeInterceptor.
 *
 * Covers: wrapping plain data, no double-wrapping of already-enveloped
 * responses, request-ID propagation from headers, request-ID generation when
 * absent, and the X-Request-Id response header.
 */
type Envelope = { data: unknown; meta: { requestId: string } };

describe('ResponseEnvelopeInterceptor', () => {
  let interceptor: ResponseEnvelopeInterceptor;

  function makeConfig(getValue: (key: string) => unknown) {
    return { get: jest.fn((key: string) => getValue(key)) } as never;
  }

  function makeContextAndHandler(requestHeaders: Record<string, string | undefined>) {
    const setHeader = jest.fn();
    const response = { setHeader } as never;
    const request = { headers: requestHeaders } as never;
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    } as unknown as ExecutionContext;
    const handler: CallHandler = { handle: () => of({ some: 'data' }) };
    return { context, handler, setHeader };
  }

  beforeEach(() => {
    interceptor = new ResponseEnvelopeInterceptor(makeConfig(() => undefined));
  });

  it('wraps plain handler data into { data, meta } envelope', async () => {
    const { context, handler, setHeader } = makeContextAndHandler({});

    const result = (await interceptor.intercept(context, handler).toPromise()) as Envelope;

    expect(result).toEqual({
      data: { some: 'data' },
      meta: { requestId: expect.any(String) },
    });
    expect(typeof result.meta.requestId).toBe('string');
    expect(result.meta.requestId.length).toBeGreaterThan(0);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', result.meta.requestId);
  });

  it('propagates the x-request-id request header into meta and response header', async () => {
    const { context, handler, setHeader } = makeContextAndHandler({
      'x-request-id': 'client-provided-id-123',
    });

    const result = (await interceptor.intercept(context, handler).toPromise()) as Envelope;

    expect(result.meta.requestId).toBe('client-provided-id-123');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'client-provided-id-123');
  });

  it('falls back to x-amzn-requestid when x-request-id is absent', async () => {
    const { context, handler, setHeader } = makeContextAndHandler({
      'x-amzn-requestid': 'amzn-id-456',
    });

    const result = (await interceptor.intercept(context, handler).toPromise()) as Envelope;

    expect(result.meta.requestId).toBe('amzn-id-456');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'amzn-id-456');
  });

  it('generates a request ID when no inbound header is present', async () => {
    const { context, handler, setHeader } = makeContextAndHandler({});

    const result = (await interceptor.intercept(context, handler).toPromise()) as Envelope;

    expect(result.meta.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledTimes(1);
  });

  it('does not double-wrap an already-enveloped response', async () => {
    const alreadyEnveloped = {
      data: { items: [], nextCursor: null },
      meta: { requestId: 'pre-existing-id' },
    };
    const setHeader = jest.fn();
    const response = { setHeader } as never;
    const request = { headers: {} } as never;
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    } as unknown as ExecutionContext;
    const handler: CallHandler = { handle: () => of(alreadyEnveloped) };

    const result = await interceptor.intercept(context, handler).toPromise();

    expect(result).toBe(alreadyEnveloped);
    // Every response still carries an X-Request-Id header.
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
  });
});
