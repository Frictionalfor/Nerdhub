import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';

/**
 * Catches all unhandled exceptions and returns a consistent, machine-readable
 * error envelope. Never leaks stack traces, SQL or provider internals to the
 * client.
 *
 * Error shape (docs/architecture/API_CONVENTIONS.md):
 * { error: { code, message, details?, requestId } }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const requestId =
      (request.headers['x-request-id'] as string) ??
      (request.headers['x-amzn-requestid'] as string) ??
      crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      code =
        typeof responseBody === 'string'
          ? responseBody
          : ((responseBody as { code?: string; message?: string })?.code ?? 'HTTP_EXCEPTION');
      message =
        typeof responseBody === 'string'
          ? responseBody
          : ((responseBody as { code?: string; message?: string })?.message ?? exception.message);
    } else {
      // Unexpected (non-HTTP) errors are treated as internal server errors.
      // Never leak internal exception messages, stack details, SQL, or provider
      // internals to the client; they are logged server-side instead.
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred.';
    }

    const isServerError = status >= 500;

    if (isServerError) {
      this.logger.error(
        {
          context: 'HttpExceptionFilter',
          status,
          code,
          requestId,
          path: request.url,
          method: request.method,
        },
        exception instanceof Error ? (exception.stack ?? String(exception)) : String(exception)
      );
    }

    response.setHeader('x-request-id', requestId);

    response.status(status).json({
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        requestId,
      },
    });
  }
}
