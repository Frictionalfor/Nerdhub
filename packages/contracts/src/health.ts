/**
 * Health check response contract.
 *
 * Returned by GET /api/v1/health. Indicates the API process is up and able to
 * serve requests. Readiness (database/queue connectivity) is reported separately
 * at GET /api/v1/readiness.
 */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ok' | 'degraded';
  service: string;
  checks: ReadinessCheck[];
  timestamp: string;
}

export interface ReadinessCheck {
  name: string;
  status: 'ok' | 'fail';
  latencyMs?: number;
  error?: string;
}
