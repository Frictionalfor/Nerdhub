# NerdHub

**A place where curiosity has no boundaries.**

NerdHub is an open-source-core community and creation ecosystem for curious people. It brings together discussions, questions, ideas, blogs, projects, challenges, specialist communities, opportunities, learning resources and profile customization.

> **Project status:** M0 engineering foundation implemented
> **Current target:** M1 — Identity and onboarding
> **Product model:** Open-source core, independently operated official service

## What NerdHub is

NerdHub is for people interested in technology, science, mathematics, engineering, hardware, art, philosophy, research and subjects that have not been invented yet. It should make it easy to ask questions, share unfinished ideas, find collaborators, publish useful knowledge and participate in meaningful challenges.

NerdHub is not intended to be another engagement-maximizing social feed. It prioritizes useful contributions, learning, attribution, safety and curiosity.

## MVP scope

The first release is focused on a reliable desktop application with:

- Account registration and sign-in (email/password; GitHub and Google OAuth first).
- Onboarding, profiles, interests and topic following.
- Following and latest feeds.
- Discussions, questions and ideas with comments, reactions and bookmarks.
- Basic long-form articles/blog publishing.
- Reporting, blocking and initial moderation workflows.
- Transparent XP, achievements, leaderboards and a small cosmetic catalogue.
- In-app notifications.
- Account data export and deletion-request foundations.

Projects, clubs, challenges, opportunities, events, direct messaging, learning paths, mobile clients and a public code-execution judge are staged beyond the first MVP. See [Product scope](docs/product/PRODUCT_REQUIREMENTS.md).

## Technology baseline

| Area         | Baseline                                            |
| ------------ | --------------------------------------------------- |
| Desktop      | Tauri 2, React, TypeScript, Vite                    |
| API          | NestJS modular monolith                             |
| Database     | PostgreSQL, Prisma                                  |
| Cache / jobs | Redis, BullMQ                                       |
| Worker       | Separate Node.js process                            |
| API contract | REST, OpenAPI 3.1                                   |
| File storage | S3-compatible object storage                        |
| Monorepo     | pnpm workspaces, Turborepo                          |
| Tests        | Vitest/Jest as appropriate, Playwright for UI flows |

The API is the authority for identity, permissions, moderation, XP, reputation and virtual currency. The desktop renderer must never be trusted to make these decisions.

## Repository status and setup

Milestone M0 (engineering foundation) is implemented. A clean checkout installs, lints, typechecks, tests and builds.

### Local setup

1. Install dependencies:
   ```
   pnpm install
   ```
2. Start local infrastructure (PostgreSQL + Redis):
   ```
   docker compose up -d
   ```
3. Generate the Prisma client and apply migrations:
   ```
   pnpm --filter @nerdhub/api prisma generate
   DATABASE_URL=postgresql://nerdhub:nerdhub@localhost:5432/nerdhub pnpm --filter @nerdhub/api prisma migrate deploy
   ```
4. Copy the environment file:
   ```
   cp .env.example .env
   ```

### Verification

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The API and worker expect `DATABASE_URL` and `REDIS_URL` from the environment (see `.env.example`).

### Prerequisites

- Git
- Node.js (version pinned in `.node-version` / `package.json` engines)
- pnpm (version pinned in `package.json` packageManager)
- Rust toolchain required to build/run the Tauri desktop binary (frontend typecheck/build via Vite does not require Rust)
- Docker Engine and Compose plugin for local PostgreSQL and Redis

Use the exact versions recorded in `package.json`, `.node-version` and `pnpm-lock.yaml`.

## Documentation map

- [Product requirements](docs/product/PRODUCT_REQUIREMENTS.md)
- [MVP definition and acceptance criteria](docs/product/MVP.md)
- [Architecture overview](docs/architecture/ARCHITECTURE.md)
- [Repository structure](docs/architecture/REPOSITORY_STRUCTURE.md)
- [Data model](docs/architecture/DATA_MODEL.md)
- [API conventions](docs/architecture/API_CONVENTIONS.md)
- [Security and privacy](docs/SECURITY.md)
- [Threat model](docs/engineering/THREAT_MODEL.md)
- [Development workflow](docs/engineering/DEVELOPMENT_WORKFLOW.md)
- [Testing strategy](docs/engineering/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Deployment and operations](docs/operations/DEPLOYMENT.md)
- [Release process](docs/operations/RELEASES.md)
- [AI coding-agent workflow](docs/engineering/AI_AGENT_WORKFLOW.md)
- [Decisions / ADRs](docs/architecture/adr/README.md)

## AI coding tools

NerdHub uses a shared repository contract for **Kilo, Antigravity (Agy), Codex and GitHub Copilot**:

1. `AGENTS.md` is the top-level source of truth for coding-agent behavior.
2. `.github/copilot-instructions.md` adapts those rules for GitHub Copilot.
3. `.kilocode/rules/nerdhub.md` and `.agent/rules/nerdhub.md` provide tool-specific entry points.
4. Each task must have one primary agent/owner. Do not let multiple agents edit the same files concurrently.
5. Agents must inspect the current git state, plan first, implement one bounded task, run checks and report exact results.
6. Human review is required for authentication, authorization, migrations, security, moderation and ledger changes.

Read [AI agent workflow](docs/engineering/AI_AGENT_WORKFLOW.md) before delegating work.

## Project principles

- Curiosity over credentials.
- Knowledge over popularity.
- Merit over money.
- Attribution and licensing matter.
- Safety and privacy are foundational.
- Extensible topics and modules.
- Portable identity and user data.
- Accessibility and progressive complexity.
- Prefer a modular monolith until real operational evidence justifies service extraction.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md) before contributing.

## Licensing

The intended licensing model has not yet been legally selected. Do not publish a license file or claim that the project is MIT/Apache/GPL until the maintainers explicitly decide:

- the license for application source,
- the license for documentation and design assets,
- treatment of trademarks and the NerdHub name,
- third-party asset and dependency obligations.

See [License decision](docs/engineering/LICENSE_DECISION.md).

## Status

The M0 engineering foundation is complete. The next milestone is M1 — Identity and onboarding; see [the roadmap](docs/ROADMAP.md).
