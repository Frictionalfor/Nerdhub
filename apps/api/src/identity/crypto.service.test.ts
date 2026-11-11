import { CryptoService } from './crypto.service';

/**
 * Unit tests for CryptoService (Phase 1 cryptographic foundations).
 *
 * Covers: Argon2id password hashing, verification, invalid input handling,
 * token generation/digest/comparison, and concurrency-semaphore behaviour
 * (queue saturation and slot release).
 *
 * Uses Jest globals (describe/it/expect), matching the existing API test
 * convention in this package.
 */
describe('CryptoService', () => {
  const service = new CryptoService();

  describe('hashPassword', () => {
    it('produces a valid Argon2id PHC hash string', async () => {
      const hash = await service.hashPassword('correct-password-12345');

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$argon2id\$/);
      // PHC format: $algorithm$version$params$salt$hash
      const parts = hash.split('$');
      expect(parts).toHaveLength(6);
      expect(parts[1]).toBe('argon2id');
    });

    it('produces different hashes for the same password (random salt)', async () => {
      const hash1 = await service.hashPassword('same-password-12345');
      const hash2 = await service.hashPassword('same-password-12345');
      expect(hash1).not.toBe(hash2);
    });

    it('rejects invalid input', async () => {
      await expect(service.hashPassword('')).rejects.toThrow();
      await expect(service.hashPassword('' as unknown as string)).rejects.toThrow();
      await expect(service.hashPassword(undefined as unknown as string)).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('verifies a correct password', async () => {
      const hash = await service.hashPassword('verify-me-12345');
      const result = await service.verifyPassword('verify-me-12345', hash);
      expect(result).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const hash = await service.hashPassword('correct-password-12345');
      const result = await service.verifyPassword('wrong-password-12345', hash);
      expect(result).toBe(false);
    });

    it('rejects invalid input', async () => {
      const hash = await service.hashPassword('correct-password-12345');
      await expect(service.verifyPassword('', hash)).rejects.toThrow();
      await expect(service.verifyPassword('correct-password-12345', '')).rejects.toThrow();
    });
  });

  describe('generateToken', () => {
    it('generates a 256-bit (64-char hex) token', () => {
      const token = service.generateToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('produces unique tokens on each call', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('produces a 256-bit SHA-256 hex digest', () => {
      const digest = service.hashToken('some-token-value');
      expect(digest.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(digest)).toBe(true);
    });

    it('is deterministic', () => {
      expect(service.hashToken('same-token')).toBe(service.hashToken('same-token'));
    });

    it('rejects invalid input', () => {
      expect(() => service.hashToken('')).toThrow();
    });
  });

  describe('compareToken', () => {
    it('returns true for a matching token/digest pair', () => {
      const token = service.generateToken();
      const digest = service.hashToken(token);
      expect(service.compareToken(token, digest)).toBe(true);
    });

    it('returns false for a mismatched token', () => {
      const digest = service.hashToken('token-one');
      expect(service.compareToken('token-two', digest)).toBe(false);
    });

    it('returns false for mismatched length', () => {
      const digest = service.hashToken('short');
      expect(service.compareToken('a-different-length-token-value', digest)).toBe(false);
    });

    it('rejects invalid input', () => {
      expect(() => service.compareToken('', 'digest')).toThrow();
      expect(() => service.compareToken('token', '')).toThrow();
    });
  });

  describe('generateSecureId', () => {
    it('generates a 128-bit (32-char hex) identifier', () => {
      const id = service.generateSecureId();
      expect(id.length).toBe(32);
      expect(/^[0-9a-f]{32}$/.test(id)).toBe(true);
    });

    it('produces unique identifiers', () => {
      expect(service.generateSecureId()).not.toBe(service.generateSecureId());
    });
  });

  describe('concurrency semaphore', () => {
    it('limits concurrent hashing and fails fast when the queue is saturated', async () => {
      const total = 20;
      const results = await Promise.allSettled(
        Array.from({ length: total }, () => service.hashPassword('concurrency-test-password-12345'))
      );

      const rejected = results.filter((r) => r.status === 'rejected');
      const fulfilled = results.filter((r) => r.status === 'fulfilled');

      // Every call must settle (none hang).
      expect(rejected.length + fulfilled.length).toBe(total);

      // Queue saturation must cause fast failures (4 active + 8 queued = 12 max;
      // 20 concurrent => at least 8 reject immediately).
      expect(rejected.length).toBeGreaterThan(0);
      for (const r of rejected) {
        if (r.status === 'rejected') {
          expect(r.reason).toBeInstanceOf(Error);
        }
      }
    });

    it('resolves all calls within limits without hanging', async () => {
      const total = 8; // 4 active + 4 queued, within capacity
      const results = await Promise.allSettled(
        Array.from({ length: total }, () => service.hashPassword('within-limits-password-12345'))
      );

      const failed = results.filter((r) => r.status === 'rejected');
      expect(failed.length).toBe(0);
      for (const r of results) {
        if (r.status === 'fulfilled') {
          expect(r.value).toMatch(/^\$argon2id\$/);
        }
      }
    });

    it('exposes semaphore stats', () => {
      const stats = service.getSemaphoreStats();
      expect(stats.active).toBe(0);
      expect(stats.queued).toBe(0);
      expect(stats.maxConcurrent).toBe(4);
      expect(stats.maxQueue).toBe(8);
    });
  });
});
