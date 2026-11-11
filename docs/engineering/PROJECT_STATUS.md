# Project Status

**Current phase:** M0 — Engineering foundation (implemented + remediated)
**Current release:** Not released
**Implementation status:** Implemented and verified locally

## Milestone M0 — complete

The engineering foundation is implemented and remediated per the M0 audit. The following exit criteria have been verified from a clean checkout:

- [x] Monorepo installs from a clean checkout (`pnpm install --frozen-lockfile`, pnpm workspaces + Turborepo, `pnpm-lock.yaml` committed)
- [x] Formatting (`pnpm format:check`), lint (`pnpm lint`: 0 errors), typecheck (`pnpm typecheck`), tests (`pnpm test`), and builds (`pnpm build`) all pass across all 6 workspace packages
- [x] Desktop shell (Tauri 2 + React + TypeScript + Vite) — `ThemeProvider`/`OnlineProvider` wrap the app root, CSS (Tailwind v4 design tokens) is emitted in the production build, app mount test guards against missing-provider regression; frontend typechecks, lints, tests and builds; the Tauri native binary requires a Rust toolchain which is **not** available in this environment, so `cargo build`/`tauri dev`/`tauri build` could not be executed here (noted limitation)
- [x] API health endpoint responds (`GET /api/v1/health`)
- [x] API readiness endpoint responds (`GET /api/v1/readiness`, database + cache checks)
- [x] Unexpected server errors return a generic 500 (no internal message leakage); covered by unit test
- [x] API client sets `Content-Type: application/json` on POST/PATCH JSON bodies; bodyless GET/DELETE omit it; custom caller headers preserved; covered by unit tests
- [x] API lifecycle-aware graceful shutdown on SIGTERM/SIGINT (`app.close()` releases Prisma/Redis, exit code 0); verified at runtime
- [x] API and worker both start via dev (`start:dev`) and production (`start`) entry points
- [x] Worker starts, connects to Redis, and processes a real BullMQ `ping` job
- [x] Worker SIGTERM/SIGINT triggers lifecycle-aware graceful shutdown (`app.close()` releases Redis/queue resources), exit code 0
- [x] PostgreSQL migrations run from an empty database (initial `User` foundation table mapped to `users`)
- [x] CI configuration present (GitHub Actions: install, format, lint, typecheck, tests, build) — validated as YAML; `corepack enable` precedes setup-node pnpm caching; Prisma Client generated explicitly in every job that typechecks/builds/tests; not executed against GitHub Actions (no runner access)
- [x] `.env.example` contains no real secrets; `ALLOWED_ORIGINS` documented
- [x] Least-privilege Tauri capabilities (dialog plugin permission and unused webview/window permissions removed)
- [x] Local setup instructions documented below

## Milestone M1 — Phase 1 AUTHORIZED / IN PROGRESS

M1 (Identity and onboarding) product decisions were explicitly **ACCEPTED** by the project owner on 2026-11-10, and ADR 0008 was marked **Accepted** (2026-11-10), authorizing M1 Phase 1 implementation.

The following pre-implementation conditions are satisfied:

- [x] Product decisions M1-P-01 through M1-P-04 — ACCEPTED (2026-11-10)
- [x] ADR 0008 — Accepted (2026-11-10)
- [x] M1 final security conditions resolved (documented):
  - Redis outage fail-closed for writes/sensitive operations; degraded read-only only on explicitly approved endpoints; max exposure 15 minutes; logging + monitoring; auto-recovery
  - Refresh token idempotency response cache with authenticated encryption, dedicated ≥256-bit key (rotated every 90 days, never stored with ciphertext), 30-second TTL, exact same/different `Idempotency-Key` replay behavior
  - Maximum five concurrent sessions; oldest evicted deterministically (`created_at`, `session_id` tie-break); transactional eviction+creation; user notified which session was signed out

M1 Phase 1 implementation (Database Schema & Cryptographic Foundation per `IMPLEMENTATION_PLAN.md`) is complete and verified:

- [x] Prisma identity models + migration `0002_m1_identity_foundation`
- [x] `CryptoService` (Argon2id with bounded concurrency semaphore, 256-bit tokens, SHA-256 digests)
- [x] Shared identity contracts/Zod schemas in `packages/contracts/src/identity/`
- [x] Unit + integration tests for models, crypto, migrations (all passing)
- [x] Format, lint, typecheck, test, build all green across all 7 packages
- [x] `docs/engineering/audits/M1_PHASE_1_IMPLEMENTATION_REPORT.md` written

M1 Phase 2 (Sessions & JWT) has **not** been started; implementation pauses here for engineering review.

## Milestone M0 — complete

- [x] **MED-03 standard API response envelope:** Implemented (`{ data, meta: { requestId } }`, `X-Request-Id` header, no double-wrapping) — unit + integration tested, runtime verified
- [x] **API Client Envelope Fix:** Fixed null/false/0/"" handling in `NerdHubApiClient` (`client.ts:78`), verified with 6 new regression tests (14/14 tests passing)
- [x] **M1 final security conditions resolved (documented):**
  - Redis outage fail-closed for writes/sensitive operations; degraded read-only only on explicitly approved endpoints; max exposure 15 minutes; logging + monitoring; auto-recovery
  - Refresh token idempotency response cache with authenticated encryption, dedicated ≥256-bit key (rotated every 90 days, never stored with ciphertext), 30-second TTL, exact same/different `Idempotency-Key` replay behavior
  - Maximum five concurrent sessions; oldest evicted deterministically (`created_at`, `session_id` tie-break); transactional eviction+creation; user notified which session was signed out
- [x] **M1 documentation finalized:**
  - `docs/architecture/identity/IDENTITY_ARCHITECTURE.md`, `SESSION_ARCHITECTURE.md`, `DESKTOP_OAUTH.md`, `DATABASE_DESIGN.md`, `API_DESIGN.md`
  - `docs/product/identity/PRODUCT_DECISIONS.md`, `IDENTITY_REQUIREMENTS.md`, `ONBOARDING_REQUIREMENTS.md` (all decisions ACCEPTED 2026-11-10)
  - `docs/engineering/identity/SECURITY_REQUIREMENTS.md`, `THREAT_MODEL.md`, `ACCEPTANCE_CRITERIA.md`, `TESTING_STRATEGY.md`, `IMPLEMENTATION_PLAN.md`
  - `docs/architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md` (ADR 0008: Accepted 2026-11-10)
  - `docs/engineering/audits/M1_FINAL_SECURITY_SIGNOFF.md` (final security signoff for Issues 1–3)
- [x] **Audits & review reports preserved:**
  - `docs/engineering/audits/M1_INDEPENDENT_ARCHITECTURE_REVIEW.md` (First review — Rejected)
  - `docs/engineering/audits/M1_REMEDIATION_REPORT.md` (Kilo remediation report)
  - `docs/engineering/audits/M1_SECOND_INDEPENDENT_REVIEW.md` (Second review — Remediation Approved)
  - `docs/engineering/audits/M1_PRE_IMPLEMENTATION_GATE_REPORT.md` (Pre-implementation gate report)

## Known limitations

- Tauri native compilation/release cannot be verified in this environment (no Rust toolchain).
- CI workflow has not been executed against GitHub Actions (no runner access); validated as syntactically correct YAML only.
- M1 Phase 1 implementation is in progress; tests for refresh rotation, session eviction, and Redis-outage fail-closed behavior are specified in `TESTING_STRATEGY.md` §2.4 but cannot be run until M1 authentication is implemented.

## Next work

1. Complete M1 Phase 1 implementation (identity models, migration, CryptoService, contracts, tests).
2. Select source/documentation license before making the repository public (docs/engineering/LICENSE_DECISION.md).
3. Execute CI against a GitHub Actions runner with Node 26 + Docker.
4. Begin M1 Phase 2 (Sessions & JWT) after Phase 1 engineering review.

Update this file when milestone status changes. Do not mark work complete based only on generated code; require tests and review.
