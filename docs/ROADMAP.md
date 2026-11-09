# NerdHub Roadmap

This roadmap is ordered to reduce risk and keep the first release achievable. It is not a promise of dates.

## M0 — Engineering foundation

**Goal:** A clean checkout can be installed, checked and launched.

- Monorepo with pnpm workspaces and Turborepo.
- Tauri 2 + React + TypeScript + Vite desktop shell.
- NestJS API and independently runnable worker.
- PostgreSQL, Prisma and initial migration.
- Redis and BullMQ connection.
- Shared contracts/config/UI packages where justified.
- Docker Compose for local dependencies.
- Environment validation and `.env.example`.
- CI for install, format, lint, typecheck, tests and build.
- Health/readiness endpoints and structured logging.
- Architecture decision records for key choices.

**Exit criteria:** documented local setup works from a clean clone; CI passes; desktop shell launches; API health endpoint works; DB migration applies; worker starts and shuts down cleanly.

## M1 — Identity and onboarding

- Email/password registration and login.
- Email verification and password reset.
- GitHub and Google OAuth/OIDC.
- Secure sessions and sign-out.
- Profile and unique handle.
- Onboarding and interests.
- Session and account security tests.

**Exit criteria:** critical auth journeys pass automated tests; authorization is server-side; no provider secrets are exposed to the renderer.

## M2 — Topics and community

- Topic hierarchy and following.
- Following/latest feed.
- Discussions, questions and ideas.
- Comments, reactions, bookmarks.
- Search baseline.
- Report/block controls and initial moderator workflow.

**Exit criteria:** user can discover topics and safely contribute; ownership and moderation checks are tested.

## M3 — Publishing and Idea Lab

- Article/blog editor and publishing.
- Drafts and revisions.
- Idea records, updates and collaborators.
- Safe Markdown rendering and attribution.

**Exit criteria:** authoring, editing, publishing and reporting flows work; content is safely rendered.

## M4 — Gamification and cosmetics

- XP policy and append-only transaction ledger.
- Progress summaries and achievements.
- Basic leaderboards.
- NerdCoin ledger if included in MVP scope.
- Cosmetic catalogue, ownership and equipment.
- Anti-abuse, idempotency and reversal tests.

**Exit criteria:** clients cannot grant themselves XP/currency; duplicate events do not double-award; audit trail is queryable.

## M5 — Public beta hardening

- In-app notifications and preferences.
- Account export and deletion workflow.
- Accessibility and keyboard review.
- Crash/error reporting with privacy review.
- Rate limits, abuse controls and moderation tools.
- Backup/restore rehearsal and operational runbooks.
- Privacy policy, terms and community rules reviewed before public launch.

**Exit criteria:** critical user journeys, recovery, backup restore and security checks pass; known limitations are documented.

## Later releases

- Projects and collaboration.
- Clubs and club management.
- Challenges and competitions (without arbitrary code execution initially).
- Opportunities and events.
- Resource library and learning paths.
- Direct messaging only after abuse, blocking and moderation foundations are mature.
- Web client using the same API.
- Mobile clients after product validation.

## Scope rule

Do not start a later milestone merely because it is exciting. Finish the current milestone's exit criteria, record operational lessons and then reprioritize based on actual user needs.
