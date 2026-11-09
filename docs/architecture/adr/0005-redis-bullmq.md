# ADR 0005 — Jobs/cache: Redis + BullMQ

## Status

Accepted

## Context

NerdHub needs a cache and a reliable background job queue (email delivery,
notification fan-out, retryable side effects). Jobs must be retry-safe and
idempotent; the worker process consumes them separately from the API.

## Decision

Use Redis for caching and BullMQ for background jobs. The worker process
(`apps/worker`) runs BullMQ `Queue` + `Worker`. The initial example job is a
harmless `ping` job used to verify the queue; it validates input and is safe
to retry (BullMQ exponential backoff, `attempts: 3`).

## Alternatives considered

- **In-memory queue**: not durable across restarts; rejected.
- **Database-backed queue**: adds operational complexity for no M0 benefit.
- **Kafka / other distributed queue**: rejected; no microservices and
  measured need is absent.

## Consequences

- `REDIS_URL` is server/worker-side only; never in the desktop bundle.
- Job handlers are idempotent and validate payloads; duplicate delivery is
  safe.
- Job payloads are small and JSON-serializable; never contain secrets or raw
  credentials.

## Follow-up work

- Add the outbox pattern (transactional outbox table) when durable
  event publication from API transactions is required (before M1).
