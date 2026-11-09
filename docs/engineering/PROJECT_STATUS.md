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

## Known limitations

- Tauri native compilation/release cannot be verified in this environment (no Rust toolchain).
- CI workflow has not been executed against GitHub Actions (no runner access); validated as syntactically correct YAML only.

## Next work

1. Select source/documentation license before making the repository public (docs/engineering/LICENSE_DECISION.md).
2. Record the desktop auth/session strategy in an ADR (docs/architecture/adr/).
3. Execute CI against a GitHub Actions runner with Node 26 + Docker.
4. Begin M1 (Identity and onboarding) per docs/ROADMAP.md.

Update this file when milestone status changes. Do not mark work complete based only on generated code; require tests and review.
