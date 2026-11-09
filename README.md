# NerdHub

**A place where curiosity has no boundaries.**

NerdHub is an open-source-core community and creation ecosystem for curious people. It brings together discussions, questions, ideas, blogs, projects, challenges, specialist communities, opportunities, learning resources and profile customization.

> **Project status:** Pre-implementation / documentation baseline  
> **Current target:** Desktop-first MVP  
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

| Area | Baseline |
|---|---|
| Desktop | Tauri 2, React, TypeScript, Vite |
| API | NestJS modular monolith |
| Database | PostgreSQL, Prisma |
| Cache / jobs | Redis, BullMQ |
| Worker | Separate Node.js process |
| API contract | REST, OpenAPI 3.1 |
| File storage | S3-compatible object storage |
| Monorepo | pnpm workspaces, Turborepo |
| Tests | Vitest/Jest as appropriate, Playwright for UI flows |

The API is the authority for identity, permissions, moderation, XP, reputation and virtual currency. The desktop renderer must never be trusted to make these decisions.

## Repository status and setup

This repository is being bootstrapped. The documentation pack defines the intended architecture and development contract; it does **not** claim that the application code, database migrations or generated OpenAPI document already exist.

Before the first application implementation, complete [Milestone 0](docs/ROADMAP.md) and verify that a clean checkout can install, lint, typecheck, test and build.

Expected local prerequisites:

- Git
- Node.js LTS compatible with the pinned project toolchain
- pnpm (version pinned in `package.json` once the workspace is created)
- Rust toolchain required by Tauri
- Platform build dependencies for Tauri
- Docker Engine and Compose plugin for local PostgreSQL and Redis

Use the exact versions recorded in the repository's `package.json`, `.node-version`/`.nvmrc`, `rust-toolchain.toml` and lockfiles once they are added. Do not guess versions or silently upgrade toolchains.

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

This repository is a product and engineering specification ready to be translated into an executable workspace. The next task is Milestone 0, not building every product module at once.
