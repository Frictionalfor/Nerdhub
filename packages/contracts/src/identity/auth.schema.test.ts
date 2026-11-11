import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  handleSchema,
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from './auth.schema';

/**
 * Unit tests for shared identity validation contracts (Zod schemas).
 *
 * Covers: email, password (NIST SP 800-63B length policy), handle (M1-P-04
 * regex), and composite registration/login schemas.
 */
describe('identity contracts', () => {
  describe('emailSchema', () => {
    it('accepts valid emails', () => {
      expect(emailSchema.parse('nerd@example.com')).toBe('nerd@example.com');
      expect(emailSchema.parse('a.b+tag@sub.example.org')).toBe('a.b+tag@sub.example.org');
    });

    it('rejects invalid emails', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow();
      expect(() => emailSchema.parse('missing@domain')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
      expect(() => emailSchema.parse('')).toThrow();
    });
  });

  describe('passwordSchema', () => {
    it('accepts passwords >= 12 and <= 128 chars', () => {
      expect(passwordSchema.parse('correct-password-12345')).toBe('correct-password-12345');
      expect(passwordSchema.parse('a'.repeat(12))).toBe('a'.repeat(12));
      expect(passwordSchema.parse('a'.repeat(128))).toBe('a'.repeat(128));
    });

    it('rejects passwords shorter than 12 chars', () => {
      expect(() => passwordSchema.parse('short123')).toThrow();
      expect(() => passwordSchema.parse('12345678901')).toThrow(); // 11 chars
    });

    it('rejects passwords longer than 128 chars', () => {
      expect(() => passwordSchema.parse('a'.repeat(129))).toThrow();
    });

    it('does not require arbitrary complexity (NIST SP 800-63B)', () => {
      // Lowercase-only, no digits/symbols is acceptable if long enough.
      expect(passwordSchema.parse('aaaaaaaaaaaa')).toBe('aaaaaaaaaaaa');
    });
  });

  describe('handleSchema', () => {
    it('accepts valid handles', () => {
      expect(handleSchema.parse('nerd')).toBe('nerd');
      expect(handleSchema.parse('a_b_c')).toBe('a_b_c');
      expect(handleSchema.parse('x12345678901234567890123456789')).toBe(
        'x12345678901234567890123456789'
      ); // 30 chars
    });

    it('rejects handles shorter than 3 or longer than 30', () => {
      expect(() => handleSchema.parse('ab')).toThrow();
      expect(() => handleSchema.parse('a'.repeat(31))).toThrow();
    });

    it('rejects uppercase, spaces, and other characters', () => {
      expect(() => handleSchema.parse('Nerd')).toThrow();
      expect(() => handleSchema.parse('nerd hub')).toThrow();
      expect(() => handleSchema.parse('nerd-hub')).toThrow();
      expect(() => handleSchema.parse('nerd.hub')).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('accepts a valid registration payload', () => {
      const input: RegisterInput = {
        email: 'nerd@example.com',
        password: 'correct-password-12345',
        handle: 'nerd_hub',
      };
      const parsed = registerSchema.parse(input);
      expect(parsed).toEqual(input);
    });

    it('rejects missing fields', () => {
      expect(() => registerSchema.parse({ email: 'nerd@example.com' })).toThrow();
      expect(() => registerSchema.parse({ password: 'correct-password-12345' })).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('accepts a valid login payload', () => {
      const input: LoginInput = {
        email: 'nerd@example.com',
        password: 'correct-password-12345',
      };
      const parsed = loginSchema.parse(input);
      expect(parsed).toEqual(input);
    });

    it('rejects a login with an invalid password length', () => {
      expect(() => loginSchema.parse({ email: 'nerd@example.com', password: 'short' })).toThrow();
    });
  });
});
