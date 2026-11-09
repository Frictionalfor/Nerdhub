# M1 Identity & Onboarding — Testing Strategy

> **Document Status:** PROPOSED
> **Milestone:** M1 — Identity and Onboarding
> **Frameworks:** Vitest, Jest, Supertest, Testcontainers / Docker
> **Last Updated:** 2026-11-09

---

## 1. Test Pyramid & Coverage Objectives

```mermaid
flowchart TD
    E2E["End-to-End & Desktop Tests<br/>Deep-link mock, onboarding flow, UI states"]
    Integration["Integration Tests<br/>Database transactions, Redis rate limits, OAuth callback, BullMQ"]
    Unit["Unit Tests<br/>Argon2id hashing, token generators, Zod schemas, session versioning"]

    E2E --> Integration
    Integration --> Unit
```

Milestone M1 introduces extensive security boundaries. Every feature must be validated against unit, integration, and security test suites prior to approval.

---

## 2. Test Suites by Layer

### 2.1 Unit Testing Layer (Fast, In-Memory)

- **Password Hashing & Semaphore (`crypto.service.spec.ts`):**
  - Verify Argon2id produces valid PHC strings.
  - Verify concurrency semaphore rejects the 13th concurrent request when 4 are hashing and 8 are queued.
  - Verify hash timeout releases the semaphore slot.
- **Token Generation (`tokens.spec.ts`):**
  - Verify CSPRNG generates 256 bits of entropy.
  - Verify SHA-256 hash generation is deterministic and hex-encoded.
- **Validation Schemas (`auth.schema.spec.ts`):**
  - Password length constraints (min 12, max 128).
  - Handle format constraints (`[a-z0-9_]{3,30}`) and reserved word rejection.
- **Response Envelope Interceptor (`response-envelope.interceptor.test.ts`):**
  - Verify data wrapping, request ID propagation, alternate header fallback, no double wrapping.

### 2.2 Integration Testing Layer (Live PostgreSQL + Redis)

- **Session Rotation & Concurrency (`sessions.integration.spec.ts`):**
  - Concurrent refresh calls from client: verify only 1 DB rotation executes.
  - Replay test: present consumed refresh token; assert all sessions in family are revoked with HTTP 401.
  - Idempotency test: repeated requests with matching `Idempotency-Key` return identical cached token.
  - Crash test: simulate DB transaction failure; assert old refresh token remains active.
- **OAuth Callback & Collision Flow (`oauth.integration.spec.ts`):**
  - Callback with new email: auto-provisions account and profile.
  - Callback with matching existing email: assert `409 ACCOUNT_COLLISION` and valid collision token.
  - Collision resolution: valid password links account; invalid password rejects.
- **Distributed Rate Limiting (`rate-limit.integration.spec.ts`):**
  - Verification resend: 4th request within 1 hour triggers HTTP 429.
  - IP rotation: verify per-account rate limit still fires when client IP rotates.
- **Email Worker Integration (`mailer.job.spec.ts`):**
  - Verify BullMQ job is enqueued on registration and processed by worker without data loss.

### 2.3 Security & Penetration Tests

- **Timing Attacks:** Measure login response times for valid user vs non-existent user; assert deviation is within safe thresholds.
- **Deep-Link Interception:** Intercept completion code from mock URL; attempt redemption at `POST /auth/oauth/complete` without the memory PKCE verifier; assert HTTP 400 error.
- **State & Nonce Tampering:** Tamper with `state` in OAuth callback; assert callback is rejected.
- **Log Leakage Audit:** Scan test log output to ensure no plaintext passwords, JWTs, or refresh tokens are recorded.

### 2.4 Security & Resilience Integration Tests (Live PostgreSQL + Redis)

These tests validate the three M1 security conditions (Issues 1–3). They run against a live PostgreSQL + Redis instance via Docker Compose and are part of the pre-implementation gate.

- **Redis outage — fail-closed (`redis-outage.resilience.spec.ts`):**
  - Stop Redis; assert write operations (post/comment/create) are rejected with HTTP 401/503.
  - Stop Redis; assert sensitive account operations (password change, email change) are rejected with HTTP 401/503.
  - Stop Redis; assert session management (refresh rotation, sign-out-all-devices) is rejected with HTTP 401/503.
  - Stop Redis; assert approved read-only endpoints still respond (signature + expiry only) and do not return sensitive user data.
  - Stop Redis; assert every degraded request is logged at `warn` with `redis_unavailable=true` and increments failure telemetry.
  - Restart Redis; assert full session-version validation resumes automatically without restart.
  - Stop Redis; assert the API never treats Redis failure as successful session validation.

- **Refresh token idempotency & replay (`idempotency.resilience.spec.ts`):**
  - Concurrent refresh calls for the same session: verify only 1 DB rotation executes and exactly one valid successor token exists.
  - Duplicate retry with same consumed token + same `Idempotency-Key`: returns cached original rotation result, no new successor, family not revoked.
  - Same consumed token + different `Idempotency-Key`: treated as replay; entire token family revoked, session version incremented, security event recorded, re-authentication forced.
  - Expired idempotency record (>30s): retry treated as fresh request subject to normal rotation/reuse logic.
  - Redis outage during rotation: database rotation proceeds, cache skipped, no double rotation.
  - Database transaction failure during rotation: old refresh token remains valid for retry.

- **Maximum concurrent sessions — five-session cap (`session-cap.resilience.spec.ts`):**
  - First five logins create five active sessions with no eviction.
  - Sixth login evicts the oldest active session (`created_at` ascending, `session_id` tie-break).
  - Eviction and new-session creation are transactional: a failure leaves all prior sessions intact.
  - Concurrent login attempts for the same user serialize to at most five active sessions.
  - Already-revoked sessions do not count toward the cap and are not evicted.
  - The user is notified which session was signed out.
  - Notification delivery failure does not block session creation or eviction.

---

## 3. Test Execution Commands

```bash
# Unit tests across packages
pnpm test

# API integration tests (requires docker compose up -d)
DATABASE_URL=postgresql://nerdhub:nerdhub@localhost:5432/nerdhub REDIS_URL=redis://localhost:6379 pnpm --filter @nerdhub/api test:integration

# Worker tests
pnpm --filter @nerdhub/worker test

# Desktop renderer tests
pnpm --filter @nerdhub/desktop test
```
