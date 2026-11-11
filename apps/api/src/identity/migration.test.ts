/**
 * Migration safety tests.
 *
 * Validates that the M1 identity migration SQL file exists and contains the
 * expected tables, constraints, and indexes without requiring a live database.
 * These tests guard against accidental removal or corruption of the migration
 * and confirm the M0 `users` foundation table is preserved (only extended).
 */
import { readFileSync } from 'fs';
import { join } from 'path';

describe('M1 identity migration', () => {
  const MIGRATION_PATH = join(
    __dirname,
    '../../../../prisma/migrations/0002_m1_identity_foundation/migration.sql'
  );
  let sql: string;

  beforeAll(() => {
    sql = readFileSync(MIGRATION_PATH, 'utf8');
  });

  it('migration file exists and is non-empty', () => {
    expect(sql.length).toBeGreaterThan(0);
  });

  it('extends the M0 users table instead of recreating it', () => {
    // users already exists from 0001_init; 0002 only adds columns.
    expect(sql).toContain('ALTER TABLE "users"');
    expect(sql).toContain('ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false');
    expect(sql).toContain('ADD COLUMN "emailVerifiedAt" TIMESTAMPTZ');
    expect(sql).not.toContain('CREATE TABLE "users"');
  });

  it('creates all M1 identity tables', () => {
    const expectedTables = [
      'password_credentials',
      'oauth_accounts',
      'sessions',
      'auth_tokens',
      'profiles',
      'onboarding_progress',
      'interest_catalog',
      'user_interests',
      'security_events',
      'outbox_events',
    ];
    for (const table of expectedTables) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
  });

  it('uses UUID primary keys and TIMESTAMPTZ timestamps', () => {
    const uuidCount = (sql.match(/UUID NOT NULL/g) ?? []).length;
    const tsCount = (sql.match(/TIMESTAMPTZ/g) ?? []).length;
    expect(uuidCount).toBeGreaterThan(10);
    expect(tsCount).toBeGreaterThan(5);
  });

  it('enforces OAuth identity uniqueness on (provider, providerSubject)', () => {
    expect(sql).toContain('CREATE UNIQUE INDEX "oauth_accounts_provider_providerSubject_key"');
  });

  it('stores refresh tokens as SHA-256 digests (CHAR(64), unique, never plaintext)', () => {
    expect(sql).toContain('"refreshTokenHash" CHAR(64) NOT NULL');
    expect(sql).toContain('CREATE UNIQUE INDEX "sessions_refreshTokenHash_key"');
    // The migration never inserts or references plaintext token material.
    expect(sql).not.toMatch(/refresh_token/i);
  });

  it('creates indexes for actual lookup patterns', () => {
    expect(sql).toContain('CREATE UNIQUE INDEX "profiles_handle_key" ON "profiles"("handle")');
    expect(sql).toContain('CREATE UNIQUE INDEX "password_credentials_userId_key"');
    expect(sql).toContain('CREATE UNIQUE INDEX "onboarding_progress_userId_key"');
  });

  it('defines deliberate deletion/cascading behaviour', () => {
    expect(sql).toContain('ON DELETE CASCADE ON UPDATE CASCADE');
    // Security events nullify the user reference on deletion (set null).
    expect(sql).toContain('ON DELETE SET NULL ON UPDATE CASCADE');
  });

  it('uses forward-only migration semantics (no down.sql reference)', () => {
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).not.toContain('DROP COLUMN');
    expect(sql).not.toContain('-- down');
  });
});
