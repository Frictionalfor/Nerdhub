import pino, { type Logger } from 'pino';

export class PinoLogger {
  private logger: Logger;

  constructor(context?: string) {
    const level = process.env.LOG_LEVEL ?? 'info';
    this.logger = pino({
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        service: 'worker',
        context,
      },
      redact: ['password', 'token', 'secret', 'authorization'],
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

  child(bindings: Record<string, unknown>): PinoLogger {
    const child = new PinoLogger();
    child.logger = this.logger.child(bindings);
    return child;
  }
}
