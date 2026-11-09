/**
 * Standard API response envelope.
 *
 * Success: { data: T, meta: { requestId } }
 * Error:   { error: { code, message, details?, requestId } }
 */
export interface ApiResponse<T = unknown> {
  data: T;
  meta: {
    requestId: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  nextCursor: string | null;
}>;
