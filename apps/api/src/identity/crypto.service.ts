/**
 * Cryptographic foundations for the NerdHub identity subsystem.
 *
 * Provides:
 * - Argon2id password hashing (memory 64 MiB, iterations 3, parallelism 1)
 *   guarded by an application-level concurrency semaphore to protect the
 *   Node.js libuv threadpool from authentication floods.
 * - 256-bit CSPRNG token generation and SHA-256 digest storage (refresh
 *   tokens, verification/reset tokens are never persisted in plaintext).
 * - Constant-time digest comparison.
 *
 * No plaintext passwords, hashes, or tokens are ever logged.
 */
import { Injectable } from '@nestjs/common';
import argon2, { type Options as Argon2Options } from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// --- Argon2id parameters (RFC 9106 interactive baseline) -------------------

/** Memory cost: 64 MiB (65,536 KiB). */
const ARGON2ID_MEMORY_COST = 65_536;
/** Time cost: 3 iterations (~100-300 ms on standard server CPUs). */
const ARGON2ID_TIME_COST = 3;
/** Parallelism: 1 lane (restricts per-hash thread allocation). */
const ARGON2ID_PARALLELISM = 1;

/** Argon2id options applied to every password hash. */
const ARGON2ID_OPTIONS: Argon2Options = {
  type: argon2.argon2id,
  memoryCost: ARGON2ID_MEMORY_COST,
  timeCost: ARGON2ID_TIME_COST,
  parallelism: ARGON2ID_PARALLELISM,
};

// --- Concurrency semaphore (threadpool starvation mitigation) --------------

/** Maximum concurrent Argon2id hashing operations across the API process. */
const MAX_CONCURRENT_HASHES = 4;
/** Maximum queued hashing requests; excess calls fail fast. */
const MAX_QUEUE_DEPTH = 8;
/** Per-operation execution timeout; releases the semaphore slot on hang. */
const HASH_TIMEOUT_MS = 5_000;

/**
 * Bound semaphore that gates access to the Argon2id worker-thread pool.
 *
 * Only `maxConcurrent` operations may run at once; up to `maxQueue` callers
 * wait for a slot. Callers beyond the queue depth fail fast so an
 * authentication flood cannot exhaust libuv threads or block unrelated API
 * requests (health, readiness, public queries).
 */
class ConcurrencySemaphore {
  private active = 0;
  private readonly waiters: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
  }> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueue: number
  ) {}

  acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return Promise.resolve();
    }
    if (this.waiters.length >= this.maxQueue) {
      return Promise.reject(new Error('Hashing concurrency limit exceeded; try again later'));
    }
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  release(): void {
    this.active = Math.max(0, this.active - 1);
    const waiter = this.waiters.shift();
    if (waiter) {
      this.active += 1;
      waiter.resolve();
    }
  }

  /** Reject every waiter waiting for a slot (used on service shutdown). */
  rejectWaiters(): void {
    for (const waiter of this.waiters) {
      waiter.reject(new Error('CryptoService is shutting down'));
    }
    this.waiters.length = 0;
  }

  get activeCount(): number {
    return this.active;
  }

  get queuedCount(): number {
    return this.waiters.length;
  }
}

/**
 * Runs an Argon2id operation under the concurrency semaphore with an
 * execution timeout. The semaphore slot is always released, even if the
 * underlying argon2 operation continues in the threadpool after a timeout.
 */
async function runWithSemaphore<T>(
  semaphore: ConcurrencySemaphore,
  op: () => Promise<T>
): Promise<T> {
  await semaphore.acquire();
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Hash operation timed out')), HASH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([op(), timeout]);
  } finally {
    semaphore.release();
  }
}

/**
 * Cryptographic service for NerdHub identity operations.
 *
 * All secret material (passwords, tokens, hashes) is handled in memory only
 * and is never written to application logs.
 */
@Injectable()
export class CryptoService {
  private readonly semaphore = new ConcurrencySemaphore(MAX_CONCURRENT_HASHES, MAX_QUEUE_DEPTH);

  /**
   * Hash a password with Argon2id under the concurrency semaphore.
   *
   * Returns a PHC-formatted string (`$argon2id$v=19$m=65536,t=3,p=1$...`)
   * suitable for storage. Never logs the password or the resulting hash.
   *
   * Throws when the hashing queue is saturated (callers map this to HTTP 429
   * or 503) or when the operation exceeds the execution timeout.
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    return runWithSemaphore(this.semaphore, async () => {
      return (await argon2.hash(password, ARGON2ID_OPTIONS)) as string;
    });
  }

  /**
   * Verify a password against an Argon2id PHC hash.
   *
   * Verification re-hashes the candidate password, so it is also gated by the
   * concurrency semaphore. Returns `false` for invalid hashes or mismatches
   * without leaking which failure occurred.
   *
   * Throws when the hashing queue is saturated (callers map this to HTTP 429
   * or 503) or when the operation exceeds the execution timeout.
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    if (!hash || typeof hash !== 'string') {
      throw new Error('Hash must be a non-empty string');
    }
    return runWithSemaphore(this.semaphore, async () => {
      return argon2.verify(hash, password);
    });
  }

  /**
   * Generate a 256-bit (32-byte) cryptographically secure random token as a
   * lowercase hex string (64 characters).
   *
   * Intended for refresh tokens and other high-entropy secrets. Callers
   * should persist only the SHA-256 digest via `hashToken`.
   */
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash a token with SHA-256 for storage.
   *
   * Returns a lowercase hex digest (64 characters). Plaintext tokens must
   * never be persisted.
   */
  hashToken(token: string): string {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Constant-time comparison of a plaintext token against its SHA-256 digest.
   *
   * Returns `true` if the token matches the digest, `false` otherwise. Never
   * leaks timing information usable for brute-force or enumeration.
   */
  compareToken(token: string, digest: string): boolean {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }
    if (!digest || typeof digest !== 'string') {
      throw new Error('Digest must be a non-empty string');
    }
    const expected = createHash('sha256').update(token).digest('hex');
    if (expected.length !== digest.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(digest, 'utf8'));
  }

  /**
   * Generate a 128-bit cryptographically secure random identifier as a
   * lowercase hex string (32 characters). Suitable for idempotency keys and
   * non-secret unique identifiers.
   */
  generateSecureId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Get current semaphore utilization for observability / health reporting.
   */
  getSemaphoreStats(): {
    active: number;
    queued: number;
    maxConcurrent: number;
    maxQueue: number;
  } {
    return {
      active: this.semaphore.activeCount,
      queued: this.semaphore.queuedCount,
      maxConcurrent: MAX_CONCURRENT_HASHES,
      maxQueue: MAX_QUEUE_DEPTH,
    };
  }
}
