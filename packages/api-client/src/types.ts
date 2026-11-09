/**
 * Configuration for the NerdHub API client.
 */
export interface ApiClientConfig {
  /** Base URL of the API, e.g. http://localhost:4000/api/v1 */
  baseUrl: string;
  /** Optional bearer token supplier (read at request time). */
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  /** Default timeout in milliseconds. */
  timeoutMs?: number;
}

/**
 * Extra init options merged into a single request.
 */
export interface ApiClientRequestInit extends Omit<RequestInit, 'body' | 'headers'> {
  headers?: Record<string, string>;
  timeoutMs?: number;
  body?: string;
}
