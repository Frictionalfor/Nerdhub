# ADR 0004 — Database: PostgreSQL with Prisma ORM and migrations

## Status

Accepted

## Context

NerdHub requires relational integrity, transactions for multi-record
invariants, and a typed data access layer. The schema must evolve through
reviewed migrations, never manual production mutations.

## Decision

Use PostgreSQL as the database and Prisma as the ORM/migration tool. The
Prisma schema lives at `prisma/schema.prisma` and migrations under
`prisma/migrations/`. The initial M0 migration creates only the `users`
foundation table; domain tables are added per milestone.

## Alternatives considered

- **Another database (MySQL, MongoDB, …)**: rejected; PostgreSQL is the
  documented choice and no ADR justifies a second database.
- **Raw SQL / another ORM**: Prisma gives typed access and a standard
  migration workflow matching the team's constraints.

## Consequences

- Every schema change uses a new migration; applied migrations are never
  edited (forward-fix via new migrations).
- The desktop renderer never imports Prisma or server-only types.
- `DATABASE_URL` is server-side only; never exposed to the client bundle.

## Follow-up work

- Add `audit_logs` and remaining foundation tables when their modules are
  implemented (M1+).
- Document migration rollback/forward-fix strategy per migration.
