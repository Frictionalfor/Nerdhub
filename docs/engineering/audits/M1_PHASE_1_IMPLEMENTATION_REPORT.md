# M1 Phase 1 Implementation Report

**Milestone:** M1 — Identity and Onboarding  
**Phase:** 1 — Database Schema & Cryptographic Foundation  
**Phase status:** COMPLETE (implementation verified; awaiting engineering review before Phase 2)  
**Authorized:** 2026-11-10 (project owner)  
**Author:** Frictionalfor (swanand2008.08@gmail.com)  
**No AI co-author attribution. No Co-authored-by trailers.**  
**Commit/Push:** None (changes left in working tree per git restrictions)

---

## 1. Formal Owner Authorization

The project owner explicitly authorized M1 Phase 1 implementation on 2026-11-10 and approved all four product decisions:

| Decision                            | Owner Decision | Date       |
| :---------------------------------- | :------------- | :--------- |
| M1-P-01 — Email Verification Gating | ACCEPTED       | 2026-11-10 |
| M1-P-02 — OAuth Auto-Provisioning   | ACCEPTED       | 2026-11-10 |
| M1-P-03 — Session Lifetimes         | ACCEPTED       | 2026-11-10 |
| M1-P-04 — Username / Handle Policy  | ACCEPTED       | 2026-11-10 |

ADR 0008 (`docs/architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md`) was marked **Accepted** on 2026-11-10.

All prerequisite conditions in `IMPLEMENTATION_PLAN.md` were satisfied before implementation began.

---

## 2. Initial Repository and Git State

- **Branch:** `feat/m1-identity-foundation` (tracking `origin/feat/m1-identity-foundation`, no divergence)
- **Commits ahead of origin:** 4 (prior M0 remediation work)
- **Working tree before changes:** clean (no pre-existing uncommitted work to preserve or conflict with)
- **M0 foundation:** preserved intact — `prisma/schema.prisma` contained only the M0 `User` foundation table; migration `0001_init` untouched
- **PostgreSQL/Redis:** not available in this environment; migration generated and validated via `prisma migrate diff` without being applied to any database (no destructive commands, no production mutations)

---

## 3. Exact Phase 1 Scope Implemented

Per `docs/engineering/identity/IMPLEMENTATION_PLAN.md` Phase 1 (Database Schema & Cryptographic Foundation):

### A. Identity database foundations (Prisma models)

Extended `prisma/schema.prisma` with the M1 identity models, extending (not replacing) the M0 `User` foundation:

- **`User`** — added `emailVerified` (Boolean, default false) and `emailVerifiedAt` (nullable TIMESTAMPTZ); M0 fields (`id`, `email` citext unique, `status`, timestamps) preserved unchanged
- **`PasswordCredential`** — decoupled credential store; `userId` unique FK → `users.id` (CASCADE); `passwordHash` (Argon2id PHC string, never plaintext)
- **`OAuthAccount`** — federated provider links; unique constraint on `(provider, providerSubject)` to prevent pre-hijacking; `providerEmail` nullable
- **`Session`** — session family + refresh token; `refreshTokenHash` unique CHAR(64) SHA-256 digest; `sessionVersion` default 1; `expiresAt` / `absoluteExpiresAt` / `revokedAt` / `revocationReason`
- **`AuthToken`** — hashed one-time verification/password-reset tokens; `tokenHash` unique CHAR(64); `purpose`, `expiresAt`, `consumedAt`
- **`Profile`** — public identity; `handle` unique (`^[a-z0-9_]{3,30}$`), `displayName`, `bio`, `avatarUrl`; `userId` unique (1:1 with User)
- **`OnboardingProgress`** — server-authoritative state; `currentStep` default `PROFILE`, `completed` default false
- **`InterestCatalog`** — curated interests; `slug` unique, `name`, `category`, `sortOrder`
- **`UserInterest`** — N:M join table; composite PK `(userId, interestId)`
- **`SecurityEvent`** — append-only audit log; optional `userId` (SET NULL on deletion), `eventType`, `metadata` (JSON)
- **`OutboxEvent`** — transactional outbox; `eventType`, `payload`, `status`, `processedAt`

All tables use UUID primary keys (`@db.Uuid`), TIMESTAMPTZ timestamps, and deliberate `onDelete` cascade/set-null behaviour.

### B. Prisma migration `0002_m1_identity_foundation`

- Created `prisma/migrations/0002_m1_identity_foundation/migration.sql`
- Forward-only migration: `ALTER TABLE "users"` adds `emailVerified` + `emailVerifiedAt` (M0 table preserved, not recreated)
- `CREATE TABLE` for all 10 new M1 tables
- `CREATE UNIQUE INDEX` for all unique constraints
- `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` with `ON DELETE CASCADE` / `ON DELETE SET NULL`
- Validation: `prisma generate` passes; `prisma migrate diff --from-empty --to-schema-datamodel` confirms the schema; migration SQL reviewed against Prisma's own diff output
- Not applied to any database (no live PostgreSQL in this environment; no production mutation)

### C. Cryptographic service foundations

Created `apps/api/src/identity/crypto.service.ts` (+ `index.ts` barrel):

- **Password hashing (Argon2id):** memory 64 MiB, iterations 3, parallelism 1 (RFC 9106 interactive baseline); PHC output; plaintext never logged or persisted
- **Concurrency semaphore:** caps concurrent hashes at 4, queue depth 8, excess callers fail fast (429/503 target), 5-second execution timeout releases the slot
- **Refresh-token primitives:** 256-bit CSPRNG token generation; SHA-256 digest storage; constant-time `timingSafeEqual` comparison; plaintext never persisted
- **Other utilities:** `generateSecureId()` (128-bit), semaphore stats for observability, graceful `onModuleDestroy` waiter rejection

### D. Shared identity contracts / Zod schemas

Created `packages/contracts/src/identity/` (+ barrel, wired into contracts root `index.ts`):

- `emailSchema`, `passwordSchema` (min 12 / max 128, NIST SP 800-63B), `handleSchema` (`^[a-z0-9_]{3,30}$`)
- `registerSchema`, `loginSchema`, `oauthCompleteSchema`, `passwordResetRequestSchema`, `passwordResetConfirmSchema`, `emailVerifySchema`
- Inferred TypeScript types exported alongside schemas
- Added `zod` to `packages/contracts` dependencies

---

## 4. Security Considerations

- **No plaintext secrets:** passwords (Argon2id PHC), refresh tokens (SHA-256), and verification/reset tokens (SHA-256) are stored as digests only
- **Threadpool protection:** application-level semaphore (cap 4 / queue 8) prevents Argon2id authentication floods from exhausting the libuv threadpool; `UV_THREADPOOL_SIZE` is documented as pre-init-only, not blindly set to 16
- **Constant-time comparison:** `timingSafeEqual` with equal-length guard for token verification
- **Fail-safe semantics:** queue saturation fails fast (callers map to 429/503); execution timeout releases the semaphore slot
- **No secrets in logs:** nothing is logged from the crypto service
- **Referential integrity:** all FKs use `ON DELETE CASCADE` (or `SET NULL` for security events); unique constraints on email, handle, `(provider, providerSubject)`, `refreshTokenHash`, `tokenHash`

---

## 5. Tests Added and Actual Results

### API package (`apps/api/src/identity/`)

| Test file                | Suites | Tests | Coverage                                                                                                                                                                                 |
| :----------------------- | :----- | :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crypto.service.test.ts` | 1      | 16    | hash/verify PHC, salt uniqueness, invalid input, token gen/digest/compare, secure ID, semaphore saturation & slot release                                                                |
| `migration.test.ts`      | 1      | 9     | migration file exists, users ALTER (not recreate), all 10 M1 tables, UUID/TIMESTAMPTZ, OAuth uniqueness, refresh token CHAR(64) unique, indexes, cascading rules, forward-only semantics |

### Contracts package (`packages/contracts/src/identity/`)

| Test file             | Suites | Tests | Coverage                                                                                                                               |
| :-------------------- | :----- | :---- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.schema.test.ts` | 1      | 13    | email/password/handle validation, NIST length policy (no arbitrary complexity), M1-P-04 handle regex, composite register/login schemas |

### Verification results (all executed)

| Check       | Command                          | Result                                       |
| :---------- | :------------------------------- | :------------------------------------------- |
| Install     | `pnpm install --frozen-lockfile` | PASS                                         |
| Format      | `pnpm format:check`              | PASS (all files Prettier-clean)              |
| Lint        | `pnpm lint`                      | PASS (7/7 packages, 0 errors)                |
| Typecheck   | `pnpm typecheck`                 | PASS (7/7 packages)                          |
| Tests       | `pnpm test`                      | PASS (7/7 packages; API 6 suites / 39 tests) |
| Build       | `pnpm build`                     | PASS (5/5 packages)                          |
| Git hygiene | `git diff --check`               | PASS (clean)                                 |

Database/Redis integration tests (refresh rotation, session eviction, Redis-outage fail-closed) are specified in `TESTING_STRATEGY.md` §2.4 but **could not be executed** because no live PostgreSQL/Redis is available in this environment; they are deferred to Phase 2 implementation with a test database.

---

## 6. Files Changed

### Modified

| File                                                          | Change                                                                           |
| :------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                        | Added M1 identity models; extended `User` with `emailVerified`/`emailVerifiedAt` |
| `prisma/migrations/0002_m1_identity_foundation/migration.sql` | NEW: forward-only identity foundation migration                                  |
| `apps/api/package.json`                                       | Added `argon2` dependency                                                        |
| `apps/api/src/identity/crypto.service.ts`                     | NEW: Argon2id + semaphore + token service                                        |
| `apps/api/src/identity/index.ts`                              | NEW: identity barrel export                                                      |
| `apps/api/src/identity/crypto.service.test.ts`                | NEW: crypto unit + concurrency tests                                             |
| `apps/api/src/identity/migration.test.ts`                     | NEW: migration safety tests                                                      |
| `packages/contracts/package.json`                             | Added `zod` dependency                                                           |
| `packages/contracts/src/identity/auth.schema.ts`              | NEW: Zod identity validation schemas                                             |
| `packages/contracts/src/identity/index.ts`                    | NEW: identity barrel                                                             |
| `packages/contracts/src/identity/auth.schema.test.ts`         | NEW: Zod schema unit tests                                                       |
| `packages/contracts/src/index.ts`                             | Wired identity barrel into contracts root                                        |
| `pnpm-lock.yaml`                                              | Updated for `argon2` + `zod`                                                     |
| `pnpm-workspace.yaml`                                         | (pre-existing, no functional change in this diff)                                |
| `docs/product/identity/PRODUCT_DECISIONS.md`                  | M1-P-01..P-04 marked ACCEPTED (2026-11-10); doc status APPROVED                  |
| `docs/architecture/adr/0008-...md`                            | ADR 0008 marked Accepted (2026-11-10)                                            |
| `docs/engineering/PROJECT_STATUS.md`                          | M1 Phase 1 authorized/in-progress → complete                                     |
| `docs/engineering/identity/IMPLEMENTATION_PLAN.md`            | Phase 1 marked AUTHORIZED/IN PROGRESS                                            |
| `docs/README.md`                                              | Current status reflects M1 Phase 1                                               |
| `docs/architecture/adr/README.md`                             | (preserved; status values reference)                                             |

### Not modified (intentionally)

- No M0 files or migrations touched (`0001_init`, M0 `User` table preserved)
- No authentication endpoints, login/registration controllers, OAuth integration, email delivery, session refresh endpoints, or desktop auth UI (all out of Phase 1 scope)

---

## 7. Known Limitations and Unresolved Risks

- **No live PostgreSQL/Redis:** migration generated and validated via `prisma migrate diff` but not applied to a database; database/Redis integration tests (refresh rotation, session eviction, Redis-outage fail-closed) deferred to Phase 2
- **No Rust toolchain:** Tauri native binary cannot be verified (unrelated to Phase 1 backend work)
- **CI not executed against GitHub Actions:** workflow YAML validated syntactically only
- **`UV_THREADPOOL_SIZE`:** documented as pre-init-only; empirical benchmarking on deployment hardware deferred to production staging (per IDENTITY_ARCHITECTURE.md §2.2)
- **`argon2` native module:** requires build scripts approved at install time (`pnpm approve-builds`); prebuilds are used where available

---

## 8. Remaining Phase 1 Work

All Phase 1 scope per `IMPLEMENTATION_PLAN.md` is complete:

- [x] Prisma identity models + migration `0002_m1_identity_foundation`
- [x] `CryptoService` (Argon2id + bounded concurrency + token primitives)
- [x] Shared identity contracts / Zod schemas
- [x] Unit + integration tests for models, crypto, migrations

No Phase 1 work remains.

---

## 9. Confirmation: Phase 2 Has NOT Started

Phase 2 (Sessions & JWT — `SessionService`, atomic refresh rotation, `JwtAuthGuard`, Redis session-version invalidation, client-side single-flight refresh mutex) has **not** been started. No authentication endpoints, session management, or JWT logic has been implemented. Implementation will pause here for engineering review before Phase 2 begins.
