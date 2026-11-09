import { LoggerService } from '@nestjs/common';
import pino, { type Logger } from 'pino';

/**
 * Structured JSON logger backed by pino.
 *
 * Logs one JSON object per line to stdout. Secret values must never be added
 * to log contexts. In development, pino-pretty can be enabled via the
 * LOGGER_PRETTY env var for human-readable output.
 */
export class PinoLogger implements LoggerService {
  private logger: Logger;
  private readonly context: string | undefined;

  constructor(context?: string) {
    this.context = context;
    const level = process.env.LOG_LEVEL ?? 'info';

    this.logger = pino({
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: 'api',
        context: this.context,
      },
      redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'secret'],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }

  child(bindings: Record<string, unknown>): PinoLogger {
    const child = new PinoLogger(this.context);
    child.logger = this.logger.child(bindings);
    return child;
  }

  get underlying(): Logger {
    return this.logger;
  }
}
