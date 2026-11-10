/**
 * Shared identity validation contracts.
 *
 * Zod schemas consumed by the NestJS API (and mirrored by the API client)
 * to validate identity-related request bodies at the boundary. Centralising
 * these schemas here keeps validation rules consistent across the
 * monorepo and prevents drift between server and client expectations.
 *
 * Password policy follows NIST SP 800-63B: length-based (min 12, max 128)
 * with no arbitrary symbol/digit complexity rules.
 *
 * Handle policy follows M1-P-04: normalized lowercase ASCII
 * `^[a-z0-9_]{3,30}$`, immutable during M1.
 */
import { z } from 'zod';

/** Case-insensitive email address, normalised (lowercased, trimmed) by callers. */
export const emailSchema = z.string().email({ message: 'Invalid email address' });

/** Password: length-bounded per NIST SP 800-63B, no arbitrary complexity rules. */
export const passwordSchema = z
  .string()
  .min(12, { message: 'Password must be at least 12 characters' })
  .max(128, { message: 'Password must not exceed 128 characters' });

/** Handle: lowercase ASCII, 3-30 chars, immutable during M1. */
export const handleSchema = z.string().regex(/^[a-z0-9_]{3,30}$/, {
  message:
    'Handle must contain only lowercase letters, digits, and underscores, and be 3-30 characters',
});

/** Registration request body. */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  handle: handleSchema,
});

/** Login request body. */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** OAuth completion-code exchange request body. */
export const oauthCompleteSchema = z.object({
  completionCode: z.string().min(1),
  codeVerifier: z.string().min(1),
});

/** Password-reset request body. */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/** Password-reset completion request body. */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

/** Email-verification completion request body. */
export const emailVerifySchema = z.object({
  token: z.string().min(1),
});

/**
 * Inferred TypeScript types (kept in sync with the schemas automatically).
 */
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type Handle = z.infer<typeof handleSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OAuthCompleteInput = z.infer<typeof oauthCompleteSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;
