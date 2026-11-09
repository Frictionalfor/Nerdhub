# ADR 0001 — Monorepo: pnpm workspaces + Turborepo

## Status

Accepted

## Context

NerdHub is a single repository containing a desktop client (Tauri + React), a
NestJS API, a BullMQ worker, and shared TypeScript packages (contracts, API
client, config). Without a monorepo, sharing contracts and configuration
across these projects would require versioned publishing and duplicate tooling.

## Decision

Use pnpm workspaces (`apps/*`, `packages/*`) with a single `pnpm-lock.yaml`
and Turborepo for task orchestration (build, lint, typecheck, test, dev).
Pin Node, pnpm, TypeScript, Turborepo and commit the lockfile.

## Alternatives considered

- **Separate repositories per project**: increases coupling friction; shared
  contracts would need publishing/consuming cycles unsuitable for pre-1.0.
- **Nx**: capable but heavier than needed; Turborepo fits the task-oriented
  pipeline already specified.
- **pnpm only without Turborepo**: no reliable task ordering/caching across
  apps and packages.

## Consequences

- One lockfile; `pnpm install` installs the whole workspace.
- Build order inferred from `dependsOn` in `turbo.json`.
- Shared packages must not import from apps (enforced by lint `import/no-cycle`).
- Desktop Rust code lives in `apps/desktop/src-tauri`; JavaScript in the
  workspace is managed by pnpm.

## Follow-up work

- Keep `turbo.json` pipeline in sync with new package scripts.
- Record any decision to add a new workspace package in a follow-up ADR.
