import { z } from 'zod';

/**
 * Validated environment configuration for the NerdHub API.
 *
 * Parse and validate at startup. Fail fast on missing required production
 * configuration. Secret values are never logged.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
  REQUEST_ID_HEADER: z.string().default('x-request-id'),
});

export type Env = z.infer<typeof EnvSchema>;
