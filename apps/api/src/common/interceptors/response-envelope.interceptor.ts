/**
 * Response envelope interceptor.
 *
 * Wraps every successful handler result in the standard NerdHub envelope:
 * { data: T, meta: { requestId } }.
 *
 * Responses that already carry the envelope shape ({ data, meta }) are passed
 * through unchanged to avoid double-wrapping.
 *
 * A request ID is propagated from the configured inbound request header
 * (default `x-request-id`), falling back to `x-amzn-requestid`, then to a
 * freshly generated `crypto.randomUUID()` value when neither is present. The
 * request ID is echoed back in the `X-Request-Id` response header and in
 * `meta.requestId`.
 *
 * Error responses are produced by the HttpExceptionFilter and are NOT wrapped
 * by this interceptor; they keep the { error: { code, message, details?,
 * requestId } } shape documented in docs/architecture/API_CONVENTIONS.md.
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { map, Observable } from 'rxjs';
import type { Env } from '../../config/env.schema';

const DEFAULT_REQUEST_ID_HEADER = 'x-request-id';
const ALTERNATE_REQUEST_ID_HEADER = 'x-amzn-requestid';

/**
 * Shape of an already-enveloped response. Such responses pass through the
 * interceptor unchanged.
 */
interface EnvelopedResponse {
  data: unknown;
  meta: { requestId: string };
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  private readonly requestIdHeader: string;

  constructor(config: ConfigService<Env, true>) {
    this.requestIdHeader = (
      config.get<string>('REQUEST_ID_HEADER') ?? DEFAULT_REQUEST_ID_HEADER
    ).toLowerCase();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const requestId =
      (request.headers[this.requestIdHeader] as string | undefined) ??
      (request.headers[ALTERNATE_REQUEST_ID_HEADER] as string | undefined) ??
      crypto.randomUUID();

    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((result: unknown) => {
        if (this.isEnveloped(result)) {
          return result;
        }
        return {
          data: result,
          meta: { requestId },
        } as { data: unknown; meta: { requestId: string } };
      })
    );
  }

  private isEnveloped(result: unknown): result is EnvelopedResponse {
    return (
      result !== null &&
      typeof result === 'object' &&
      'data' in result &&
      'meta' in result &&
      typeof (result as EnvelopedResponse).meta === 'object' &&
      (result as EnvelopedResponse).meta !== null &&
      'requestId' in (result as EnvelopedResponse).meta
    );
  }
}
