# Architecture Decision Records

Use ADRs for decisions that are expensive to reverse or affect multiple modules.

## Status values

- Proposed
- Accepted
- Superseded
- Rejected

## Naming

`NNNN-short-decision-title.md`, sequential numbering.

## Required sections

1. Title and status.
2. Context and constraints.
3. Decision.
4. Alternatives considered.
5. Consequences and trade-offs.
6. Follow-up work.

## Initial decisions to record in M0

- Desktop framework and UI stack.
- Backend modular monolith and process boundaries.
- PostgreSQL/Prisma data ownership.
- Authentication/session strategy for desktop + API.
- Monorepo and package dependency boundaries.
- Object storage and upload security.
- License selection (must be a maintainer decision).
