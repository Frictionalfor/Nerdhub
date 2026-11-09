import type { ApiResponse, ApiError, PaginatedResponse } from '@nerdhub/contracts';
import type { ApiClientConfig, ApiClientRequestInit } from './types.js';
import { ApiClientError } from './errors.js';

const JSON_CONTENT_TYPE = 'application/json';

function isEnvelopedResponse<T>(body: unknown): body is ApiResponse<T> {
  return (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    'meta' in body &&
    typeof (body as { meta: unknown }).meta === 'object' &&
    (body as { meta: unknown }).meta !== null
  );
}

/**
 * Thin, typed fetch client for the NerdHub REST API.
 *
 * The desktop renderer owns network state (offline/loading/error) but never
 * makes authorization decisions. This client only transports requests and
 * parses responses; the API is authoritative for auth, ownership and business
 * rules.
 */
export class NerdHubApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken:
    (() => string | undefined | Promise<string | undefined>) | undefined;
  private readonly defaultTimeoutMs: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.getAccessToken = config.getAccessToken;
    this.defaultTimeoutMs = config.timeoutMs ?? 30_000;
  }

  private async headers(init: ApiClientRequestInit = {}): Promise<Record<string, string>> {
    const tokenSupplier = this.getAccessToken;
    // Header precedence (later entries win):
    //  1. defaults (Accept, Content-Type when a body is present)
    //  2. caller-supplied headers (init.headers)
    //  3. Authorization (managed by the bearer-token supplier)
    const headers: Record<string, string> = {
      Accept: JSON_CONTENT_TYPE,
      ...(init.body !== undefined ? { 'Content-Type': JSON_CONTENT_TYPE } : {}),
      ...init.headers,
    };

    if (tokenSupplier) {
      const token = await tokenSupplier();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(path: string, init: ApiClientRequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), init.timeoutMs ?? this.defaultTimeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: await this.headers(init),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') ?? '';
      const isJson = contentType.includes(JSON_CONTENT_TYPE);
      const body = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorBody = body as ApiError | undefined;
        throw new ApiClientError(
          response.status,
          errorBody?.error?.message ?? `Request failed with status ${response.status}`,
          errorBody?.error?.code,
          errorBody
        );
      }

      if (isEnvelopedResponse<T>(body)) {
        return {
          data: body.data,
          meta: {
            ...body.meta,
            requestId: body.meta.requestId || (response.headers.get('x-request-id') ?? ''),
          },
        };
      }

      return {
        data: body as T,
        meta: {
          requestId: response.headers.get('x-request-id') ?? '',
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(0, 'Request timed out', 'REQUEST_TIMEOUT', undefined);
      }
      throw new ApiClientError(
        0,
        error instanceof Error ? error.message : 'Request failed',
        'UNKNOWN',
        undefined
      );
    }
  }

  /** GET a typed resource. */
  async get<T>(path: string, init?: ApiClientRequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  /** POST a typed resource. */
  async post<T, Body = unknown>(
    path: string,
    body?: Body,
    init?: ApiClientRequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  /** PATCH a typed resource. */
  async patch<T, Body = unknown>(
    path: string,
    body?: Body,
    init?: ApiClientRequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  /** DELETE a resource. */
  async delete<T>(path: string, init?: ApiClientRequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }

  /** GET a paginated collection. */
  async getPaginated<T>(path: string, init?: ApiClientRequestInit): Promise<PaginatedResponse<T>> {
    return this.request<{ items: T[]; nextCursor: string | null }>(path, {
      ...init,
      method: 'GET',
    }) as unknown as PaginatedResponse<T>;
  }
}
