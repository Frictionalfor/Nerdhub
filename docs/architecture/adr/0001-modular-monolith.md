# ADR 0001: Start with a modular monolith

**Status:** Accepted baseline

## Context

NerdHub has multiple domains but is at the beginning of implementation. Distributed services would add deployment, observability, data consistency and local development complexity before there is evidence they are needed.

## Decision

Use a NestJS modular monolith. Run the HTTP API and background worker as separate processes from the same codebase and domain modules. Preserve explicit module boundaries.

## Alternatives considered

- Microservices from day one: rejected due to operational overhead and premature distributed boundaries.
- Single process for API and jobs: rejected because worker lifecycle and scaling should be independent.

## Consequences

- Easier local development and transactional workflows.
- Requires discipline to avoid cross-module coupling.
- Service extraction can be considered later with measured evidence and a new ADR.
