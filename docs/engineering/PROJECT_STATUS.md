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

## Milestone M1 — remediated, BLOCKED pending owner acceptance

M1 (Identity and onboarding) architecture has been remediated per the independent audits. All technical conditions from the first and second independent reviews are resolved, including the three final security conditions (Redis outage fail-closed policy, refresh-token idempotency authenticated encryption, five-session cap). The API client envelope parsing bug (MED-03) is fixed and verified.

M1 implementation remains **BLOCKED** until the project owner explicitly approves product decisions M1-P-01 through M1-P-04 and marks ADR 0008 Accepted. No M1 authentication endpoints, Prisma migrations, or application auth logic have been implemented. ADR 0008 is **Proposed, NOT Accepted**. All product decisions are **PENDING** owner approval (see `docs/product/identity/PRODUCT_DECISIONS.md`); none are treated as settled.

- [x] **MED-03 standard API response envelope:** Implemented (`{ data, meta: { requestId } }`, `X-Request-Id` header, no double-wrapping) — unit + integration tested, runtime verified
- [x] **API Client Envelope Fix:** Fixed null/false/0/"" handling in `NerdHubApiClient` (`client.ts:78`), verified with 6 new regression tests (14/14 tests passing)
- [x] **M1 final security conditions resolved (documented):**
  - Redis outage fail-closed for writes/sensitive operations; degraded read-only only on explicitly approved endpoints; max exposure 15 minutes; logging + monitoring; auto-recovery
  - Refresh token idempotency response cache with authenticated encryption, dedicated ≥256-bit key (rotated every 90 days, never stored with ciphertext), 30-second TTL, exact same/different `Idempotency-Key` replay behavior
  - Maximum five concurrent sessions; oldest evicted deterministically (`created_at`, `session_id` tie-break); transactional eviction+creation; user notified which session was signed out
- [x] **M1 documentation finalized:**
  - `docs/architecture/identity/IDENTITY_ARCHITECTURE.md`, `SESSION_ARCHITECTURE.md`, `DESKTOP_OAUTH.md`, `DATABASE_DESIGN.md`, `API_DESIGN.md`
  - `docs/product/identity/PRODUCT_DECISIONS.md`, `IDENTITY_REQUIREMENTS.md`, `ONBOARDING_REQUIREMENTS.md` (all decisions PENDING owner approval)
  - `docs/engineering/identity/SECURITY_REQUIREMENTS.md`, `THREAT_MODEL.md`, `ACCEPTANCE_CRITERIA.md`, `TESTING_STRATEGY.md`, `IMPLEMENTATION_PLAN.md`
  - `docs/architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md` (ADR 0008: Proposed, Ready for Owner Acceptance — NOT Accepted)
  - `docs/engineering/audits/M1_FINAL_SECURITY_SIGNOFF.md` (final security signoff for Issues 1–3)
- [x] **Audits & review reports preserved:**
  - `docs/engineering/audits/M1_INDEPENDENT_ARCHITECTURE_REVIEW.md` (First review — Rejected)
  - `docs/engineering/audits/M1_REMEDIATION_REPORT.md` (Kilo remediation report)
  - `docs/engineering/audits/M1_SECOND_INDEPENDENT_REVIEW.md` (Second review — Remediation Approved)
  - `docs/engineering/audits/M1_PRE_IMPLEMENTATION_GATE_REPORT.md` (Pre-implementation gate report)
- [ ] Owner approves product decisions M1-P-01 through M1-P-04
- [ ] Owner marks ADR 0008 Accepted
- [ ] Owner authorizes commencement of M1 Phase 1 implementation

## Known limitations

- Tauri native compilation/release cannot be verified in this environment (no Rust toolchain).
- CI workflow has not been executed against GitHub Actions (no runner access); validated as syntactically correct YAML only.
- M1 cannot be implemented or approved until owner decisions M1-P-01..M1-P-04 are resolved and ADR 0008 is Accepted.
- M1 tests (refresh rotation, session eviction, Redis-outage fail-closed) are specified in `TESTING_STRATEGY.md` §2.4 but cannot be run until M1 authentication is implemented.

## Next work

1. Select source/documentation license before making the repository public (docs/engineering/LICENSE_DECISION.md).
2. Owner reviews and approves M1-P-01 through M1-P-04 product decisions.
3. Owner marks ADR 0008 Accepted.
4. Execute CI against a GitHub Actions runner with Node 26 + Docker.
5. Begin M1 implementation only after owner authorization.

Update this file when milestone status changes. Do not mark work complete based only on generated code; require tests and review.
