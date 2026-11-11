# ADR 0008 — M1 Identity Session and Desktop Auth Architecture

> **Status:** Accepted (2026-11-10)
> **Date:** 2026-11-09
> **Milestone:** M1 — Identity and Onboarding
> **Owner Decisions:** M1-P-01, M1-P-02, M1-P-03, M1-P-04 — ACCEPTED (2026-11-10)
> **Notice:** All four product decisions were explicitly approved by the project owner on 2026-11-10. This ADR is accepted and authorizes commencement of Milestone M1 Phase 1 implementation.

---

## Context

NerdHub Milestone M0 established the engineering foundation: a modular monolith architecture (NestJS API process and separate BullMQ worker), PostgreSQL with Prisma, Redis, and a Tauri 2 desktop shell. Milestone M1 introduces identity and onboarding: email/password registration, federated OAuth (GitHub, Google), email verification, secure session management, and profile initialization.

The desktop renderer is an untrusted client running on user hardware; the backend API is authoritative for all authentication, authorization, session lifetimes, and data access.

---

## Decision

Propose a dual-token session architecture combining short-lived signed JWT access tokens with database-backed refresh token families, native desktop OAuth via `nerdhub://auth/callback` paired with PKCE one-time completion codes, and decoupled credential storage.

### 1. Proposed Architecture Components

| Component                   | Architecture Specification                                                                                                                                                                                                                                                                                                                                                                                                | Reference                                                                    |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------- |
| **Access Token**            | 15-minute signed JWT carrying `sub`, `session_id`, `session_version`, `jti`. Process memory only.                                                                                                                                                                                                                                                                                                                         | [Session Architecture](../identity/SESSION_ARCHITECTURE.md)                  |
| **Refresh Token**           | 256-bit CSPRNG secret; stored strictly as **SHA-256 hash** in PostgreSQL. Token-family rotation.                                                                                                                                                                                                                                                                                                                          | [Session Architecture](../identity/SESSION_ARCHITECTURE.md)                  |
| **Token Concurrency**       | Client-side single-flight promise map + server-side PostgreSQL row lock (`SELECT FOR UPDATE`). 30s idempotency cache; cached rotation responses protected with authenticated encryption (AES-256-GCM), dedicated ≥256-bit key rotated every 90 days, key never stored with ciphertext. Same consumed token + same `Idempotency-Key` returns cached result; same token + different key treated as replay (family revoked). | [Security Requirements](../../engineering/identity/SECURITY_REQUIREMENTS.md) |
| **Session Revocation**      | Redis caches `session:{id}:version`. Version mismatch rejects token. Bounded revocation window ($\le 15$m).                                                                                                                                                                                                                                                                                                               | [Session Architecture](../identity/SESSION_ARCHITECTURE.md)                  |
| **Redis Outage Behavior**   | **Fail-closed:** all writes, sensitive account ops, account recovery, session management, and community actions rejected when Redis is down. Read-only fall-back to JWT signature/expiry only on an explicitly approved endpoint allow-list; no sensitive user data; max exposure 15m; every degraded request logged+monitored; never silent. Auto-recovery when Redis returns.                                           | [Session Architecture](../identity/SESSION_ARCHITECTURE.md)                  |
| **Max Concurrent Sessions** | 5 active sessions per user. Sixth login evicts the oldest active session (`created_at` ascending, `session_id` UUID tie-break) atomically within the same transaction; user notified which session was signed out.                                                                                                                                                                                                        | [Session Architecture](../identity/SESSION_ARCHITECTURE.md)                  |
| **Password Hashing**        | Argon2id ($m=64\text{MB}, t=3, p=1$) for passwords only. App-level semaphore (cap 4, queue depth 8, timeout 5s).                                                                                                                                                                                                                                                                                                          | [Identity Architecture](../identity/IDENTITY_ARCHITECTURE.md)                |
| **Runtime Threadpool**      | Semaphore is primary protection. Threadpool sizing verified via benchmarks prior to production staging.                                                                                                                                                                                                                                                                                                                   | [Identity Architecture](../identity/IDENTITY_ARCHITECTURE.md)                |
| **Desktop OAuth Transport** | `nerdhub://auth/callback` custom URI scheme + PKCE + `state` + OIDC `nonce` + 60s single-use completion code.                                                                                                                                                                                                                                                                                                             | [Desktop OAuth](../identity/DESKTOP_OAUTH.md)                                |
| **Account Collision**       | Return `409 ACCOUNT_COLLISION` on matching email. Reauthentication required. No auto-linking on email alone.                                                                                                                                                                                                                                                                                                              | [Identity Architecture](../identity/IDENTITY_ARCHITECTURE.md)                |
| **Email Verification**      | Gated public posting/actions; login & browsing allowed prior to verification. Redis distributed rate limiting.                                                                                                                                                                                                                                                                                                            | [Product Decisions](../../product/identity/PRODUCT_DECISIONS.md)             |
| **Handle Policy**           | Lowercase ASCII `^[a-z0-9_]{3,30}$`. Immutable during M1. Display name separate and editable.                                                                                                                                                                                                                                                                                                                             | [Product Decisions](../../product/identity/PRODUCT_DECISIONS.md)             |

---

## Alternatives Considered

- **Loopback OAuth Redirect (`http://127.0.0.1:PORT`):** Rejected. Triggers OS firewall prompts on Windows, encounters Chrome Private Network Access (PNA) navigation blocks, and requires embedding a local HTTP server in the desktop app.
- **Claimed HTTPS Links (App Links / Universal Links):** Rejected for M1. Unsupported on Linux desktops due to lack of a standardized OS-level domain claiming protocol.
- **Opaque Access Tokens:** Rejected for general API traffic. Incurs a synchronous database or cache round-trip on every request.
- **Purely Stateless JWT:** Rejected. Does not meet security requirement for session revocation on logout, password reset, or token replay.
- **Argon2id for Refresh Tokens:** Explicitly rejected. Refresh tokens are 256-bit high-entropy secrets that do not require memory-hard hashing; SHA-256 avoids CPU bottlenecks and threadpool saturation.

---

## Consequences & Guarantees

1. **Session Concurrency:** Parallel desktop requests at access token expiry coalesce into a single refresh request, eliminating false reuse revocations.
2. **Replay Protection:** Presenting an already-consumed refresh token immediately revokes all sessions in the family.
3. **No Unsafe Grace Window:** Consumed tokens can never obtain fresh tokens.
4. **Transport Security:** Local URI scheme interception is mitigated because the completion code cannot be exchanged without the memory-bound PKCE verifier.
5. **Threadpool Headroom:** Hashing concurrency bounds ensure background I/O, DNS queries, and health endpoints remain responsive during peak authentication load.

---

## Status & Readiness

- **Status:** **Accepted (2026-11-10)**
- **Decisions Status:** Decisions M1-P-01 through M1-P-04 are **ACCEPTED** (2026-11-10). All architectural and security conditions (Redis fail-closed policy, encrypted refresh-token idempotency cache, deterministic 5-session eviction) are fully resolved.
- **Next Step:** M1 Phase 1 implementation is authorized. Commence Milestone M1 Phase 1 implementation per `docs/engineering/identity/IMPLEMENTATION_PLAN.md`.
