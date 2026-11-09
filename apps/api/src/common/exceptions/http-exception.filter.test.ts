import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

/**
 * Regression test for HIGH-01: unexpected (non-HTTP) server errors must not
 * leak internal exception messages to API clients. They receive a generic
 * 500 response; the full detail is logged server-side instead.
 *
 * Uses Jest globals (describe/it/expect) injected by the test runner; types
 * come from @types/jest (declared via tsconfig "types": ["jest"]).
 */
describe('HttpExceptionFilter', () => {
  it('returns a generic message for unexpected server errors', () => {
    const logger = { error: () => undefined } as unknown as never;
    const filter = new HttpExceptionFilter(logger as never);

    const request = {
      headers: {},
      url: '/api/v1/some-path',
      method: 'GET',
    } as never;
    const response = {
      status: (code: number) => {
        expect(code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        return response;
      },
      json: (body: unknown) => {
        expect(body).toEqual({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.',
            requestId: expect.any(String),
          },
        });
      },
    } as never;
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('database connection failed: internal DSN leaked'), host);
  });

  it('preserves controlled HTTP exception messages and status codes', () => {
    const logger = { error: () => undefined } as unknown as never;
    const filter = new HttpExceptionFilter(logger as never);

    const request = { headers: {}, url: '/api/v1/health', method: 'GET' } as never;
    const response = {
      status: (code: number) => {
        expect(code).toBe(HttpStatus.BAD_REQUEST);
        return response;
      },
      json: (body: unknown) => {
        expect(body).toEqual({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'bad input',
            requestId: expect.any(String),
          },
        });
      },
    } as never;
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    const httpException = new HttpException(
      { code: 'VALIDATION_ERROR', message: 'bad input' },
      HttpStatus.BAD_REQUEST
    );

    filter.catch(httpException, host);
  });
});
