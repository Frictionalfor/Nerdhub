/**
 * Error thrown by the API client for non-ok responses.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;
  public readonly body: unknown;

  constructor(status: number, message: string, code: string | undefined, body: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}
