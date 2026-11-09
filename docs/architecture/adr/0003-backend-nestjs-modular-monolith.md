# ADR 0003 — Backend: NestJS modular monolith with separate API and worker processes

## Status

Accepted

## Context

NerdHub needs an HTTP API and a background job processor. They share domain
modules and database access but must run as separate processes so the API can
scale independently of the worker and long-running jobs cannot block request
handling.

## Decision

Use NestJS for both the API (`apps/api`) and the worker (`apps/worker`) as a
modular monolith backed by a single PostgreSQL database. The API owns domain
rules and database writes; the worker invokes application services or
dedicated job handlers without duplicating business logic.

## Alternatives considered

- **Microservices**: rejected per architecture constraints; no operational
  need at M0 and would break transactional invariants across modules.
- **Single process for API + worker**: simpler but couples request latency to
  job processing; rejected.
- **Express/Fastify directly**: NestJS provides structure, DI, validation and
  OpenAPI tooling aligned with the REST/OpenAPI contract.

## Consequences

- API and worker are separately runnable processes.
- Shared code lives in workspace packages (`@nerdhub/contracts`, etc.), not
  duplicated between API and worker.
- The worker must not duplicate reward/XP logic; it delegates to domain
  services.

## Follow-up work

- Add domain modules incrementally (identity in M1, taxonomy in M2, …).
- Record outbox/transactional outbox pattern decision when async durability
  is required (before M1 email/notification sending).
