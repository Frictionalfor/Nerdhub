# NerdHub Milestone M1 — Pre-Implementation Gate Report

> **Document Status:** OFFICIAL GATE REPORT  
> **Role:** Principal Software Architect & Engineering Lead  
> **Date:** 2026-11-09  
> **Milestone:** M1 — Identity and Onboarding  
> **Gate Status:** PRE-IMPLEMENTATION CONDITIONS RESOLVED — READY FOR OWNER ACCEPTANCE

---

## Executive Summary

Following the second independent architecture review, this pre-implementation gate report records the finalization of the four M1 product decisions by the project owner, resolves all remaining architectural and security conditions, verifies the fix for the API client envelope detection bug, and confirms the readiness of [ADR 0008](../../architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md) for owner acceptance.

### Pre-Implementation Gate Determinations

| Gate Dimension                         |             Status              | Verification Summary                                                                                                                                             |
| :------------------------------------- | :-----------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product Decisions M1-P-01..M1-P-04** |          **APPROVED**           | Formally finalized and recorded in [PRODUCT_DECISIONS.md](../../product/identity/PRODUCT_DECISIONS.md) with approval date 2026-11-09.                            |
| **Architectural Conditions**           |          **RESOLVED**           | Refresh token hashing corrected to SHA-256; Argon2id threadpool benchmarking guidelines established; passwordless collision flow defined.                        |
| **API Client Bug Fix**                 |          **VERIFIED**           | Nullish coalescing bug fixed in [`packages/api-client/src/client.ts`](../../../packages/api-client/src/client.ts); 6 new regression tests passing (14/14 total). |
| **ADR 0008**                           |    **READY FOR ACCEPTANCE**     | Updated to reflect all approved decisions and conditions; status kept as `Proposed (Ready for Owner Acceptance)`.                                                |
| **Automated Checks**                   |         **PASS (100%)**         | Format, lint, typecheck, test (7/7 packages), build (5/5 targets), and git check all pass cleanly.                                                               |
| **Implementation Authorization**       | ❌ **BLOCKED / NOT AUTHORIZED** | Authentication implementation remains blocked until the project owner accepts ADR 0008 and issues implementation authorization.                                  |

---

## 1. Product Decisions Finalized

All four product decisions in [PRODUCT_DECISIONS.md](../../product/identity/PRODUCT_DECISIONS.md) have been finalized with approval date **2026-11-09**:

### M1-P-01 — Email Verification Gating

- **Approved Decision:** Login, profile setup, and read-only topic browsing are permitted prior to verification. Public posting, commenting, reactions, messaging, and community actions strictly require a verified email address.
- **Enforcement Authority:** Backend policy guards (`EmailVerifiedGuard`) enforce gating at the NestJS API boundary, not only through desktop UI controls.

### M1-P-02 — OAuth Auto-Provisioning & Linking

- **Approved Decision:** Accounts are automatically provisioned upon OAuth authentication **only when the provider supplies a cryptographically verified email address**. Provider accounts are anchored on `(issuer, subject)`.
- **Prohibition of Insecure Auto-Linking:** The API never automatically links accounts based on matching email alone.
- **Unverified Emails:** Hidden or unverified provider emails require a separate email verification flow before community permissions are granted.
- **Account Collision:** Colliding accounts trigger a secure `409 ACCOUNT_COLLISION` flow requiring reauthentication.

### M1-P-03 — Session Lifetimes & Revocation

- **Approved Decision:**
  - Access Token Lifetime: 15 minutes (signed JWT).
  - Refresh Token Idle Lifetime: 30 days (sliding).
  - Session Absolute Lifetime: 90 days (hard ceiling).
  - Max Concurrent Sessions: 5 active sessions per user.
- **Revocation Behavior:** Single logout revokes the session family; global logout revokes all user sessions; token replay immediately revokes the family and logs a security incident.

### M1-P-04 — Username / Handle Policy

- **Approved Decision:** Format regex `^[a-z0-9_]{3,30}$`, normalized to lowercase on input.
- **Immutability:** Handles are strictly immutable during Milestone M1.
- **Display Names:** Kept separate, editable, and free-form Unicode (up to 50 characters).
- **Reserved Names:** The API enforces a reserved-word dictionary (`admin`, `nerdhub`, `mod`, `api`, `system`, `root`, etc.).

---

## 2. Architectural Conditions Resolved

All technical conditions raised during independent review have been formally incorporated into the canonical architecture documents:

### 2.1 Refresh-Token Security & Idempotency Encryption

- **Token Entropy:** 256 bits of CSPRNG entropy generated via Node crypto.
- **Storage Hash:** Stored strictly as **hex-encoded SHA-256 digests**. Plaintext tokens are never persisted in PostgreSQL or Redis.
- **Argon2id Correction:** The previous remediation proposal to store refresh tokens as Argon2id hashes was rejected. High-entropy secrets do not require memory-hard hashing; SHA-256 avoids CPU bottlenecks and threadpool saturation during routine refreshes.
- **Single-Flight Client:** Desktop client maintains an in-flight promise map keyed by session; concurrent 401s coalesce into a single refresh request.
- **Atomic Rotation:** Token consumption and reissuance execute inside a single PostgreSQL transaction with row locks (`SELECT FOR UPDATE`).
- **No Unsafe Grace Window:** Consumed tokens can never obtain fresh tokens.
- **Authenticated Encryption for Idempotency Cache:** Cached rotation responses in Redis do not expose plaintext refresh tokens. Cached envelopes are protected using **authenticated encryption (AES-256-GCM)** via a dedicated `REFRESH_IDEMPOTENCY_CACHE_KEY` (≥256 bits) managed through environment secrets, with a 30-second TTL.
- **Same Token + Same Idempotency Key:** Within the 30-second window, decrypts and returns the original rotation response without double-rotating or revoking.
- **Same Consumed Token + Different Idempotency Key:** Immediately triggers **confirmed reuse detection**, revoking the entire session family, incrementing the session version, and forcing re-authentication.

### 2.2 Password Hashing & Threadpool Safety

- **Argon2id for Passwords Only:** Memory 64 MiB, 3 iterations, 1 parallelism lane (RFC 9106).
- **Application Concurrency Semaphore:** Gate limits concurrent hashes to 4 operations with a queue depth of 8 and a 5-second timeout, bounding peak hashing memory to $\sim 256\text{ MiB}$.
- **Threadpool Sizing (`UV_THREADPOOL_SIZE`):** Documented that the semaphore is the primary defense. Threadpool sizing must be benchmarked on target deployment hardware before finalizing production configuration; `UV_THREADPOOL_SIZE=16` is not blindly imposed without measurement.

### 2.3 Desktop OAuth & Deep-Link Transport

- **Custom URI Scheme:** Formally adopted `nerdhub://auth/callback` with PKCE (`code_challenge` / `code_verifier`, S256).
- **One-Time Completion Code:** The external browser callback receives a short-lived (60s) single-use completion code.
- **URI Scheme Interception Defense:** An intercepting local process cannot redeem the completion code because it lacks the PKCE verifier held in the legitimate desktop app's memory.
- **Passwordless Collision Resolution:** If an account collision occurs with an existing account that has no password credentials (e.g. registered via another OAuth provider), the user is prompted to reauthenticate via their existing provider or complete an email challenge.

### 2.4 Session Revocation & Redis Outage Policy (Fail-Closed)

- **Bounded Revocation:** Authenticated requests validate the JWT signature, expiry, and the `session_version` claim against Redis. Revocation takes effect within at most 15 minutes.
- **Fail-Closed for Write & Sensitive Operations:** When Redis is unavailable or unreachable, all write/mutation operations, sensitive account operations (password change, email change, session management), account recovery, and community actions (posting, commenting, reactions) MUST fail closed with HTTP 401 or 503 (`SESSION_VALIDATION_UNAVAILABLE`). Revocation state is never assumed absent.
- **Degraded Read-Only Access (Approved Allow-List Only):** Non-sensitive read-only operations (public topic browsing, public post reading, `/health`, `/readiness`) MAY temporarily fall back to JWT signature and expiry verification only. Sensitive user data is never returned without session-version confirmation.
- **Enforced 15-Minute Exposure Cap:** A revoked session operating during a Redis outage can act for at most the remaining lifetime of its access token ($\le 15$ minutes).
- **Logging & Monitoring:** Every degraded request served during a Redis outage is logged at `warn` level with `redis_unavailable=true` and increments operational alerts.

### 2.5 Maximum Concurrent Sessions & Deterministic Eviction

- **Policy:** Maximum of 5 active sessions per user account.
- **Deterministic Eviction:** When a sixth session is created at login, the oldest active session (ordered deterministically by `created_at` ascending, with `session_id` UUID ascending as tie-breaker) is revoked atomically within the same transaction that creates the new session.
- **User Notification:** The user is informed upon login which device/session was signed out, and the evicted session receives HTTP 401 with code `SESSION_EVICTED` on its next request.
- **Transaction Safety:** Session eviction and new session creation commit atomically; any failure rolls back both. Already-revoked sessions are excluded from the active count.

---

## 3. Source Changes Made (API Client Bug Fix)

As authorized in Section 3 of the pre-implementation gate, the only permitted source-code change was to fix the response envelope parsing logic in [`packages/api-client/src/client.ts`](../../../packages/api-client/src/client.ts).

### 3.1 The Bug

Line 78 previously evaluated:

```typescript
data: ((body as ApiResponse<T>).data ?? body) as T,
```

Because JavaScript nullish coalescing (`??`) treats `null` as missing, an API response envelope with `data: null` (e.g. from a void mutation or a null resource) fell back to evaluating to `body`, returning `{ data: { data: null, meta: ... }, meta: ... }`. Similarly, falsy values were at risk of misinterpretation.

### 3.2 The Fix

Implemented a strict type guard [`isEnvelopedResponse<T>`](../../../packages/api-client/src/client.ts#L7-L15):

```typescript
function isEnvelopedResponse<T>(body: unknown): body is ApiResponse<T> {
  return (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    'meta' in body &&
    typeof (body as { meta: unknown }).meta === 'object' &&
    (body as { meta: unknown }).meta !== null
  );
}
```

When `isEnvelopedResponse` evaluates to `true`, the client extracts `body.data` directly:

- `data: null` $\to$ returns `null`.
- `data: false` $\to$ returns `false`.
- `data: 0` $\to$ returns `0`.
- `data: ""` $\to$ returns `""`.
- Non-envelope objects $\to$ returns raw body as `data`.
- Non-envelope arrays $\to$ returns raw array as `data`.
- Metadata and request IDs are preserved.

### 3.3 Regression Tests

Added 6 dedicated unit tests to [`packages/api-client/src/client.test.ts`](../../../packages/api-client/src/client.test.ts#L173-L248). All 14 tests in `@nerdhub/api-client` pass cleanly.

---

## 4. Verification Check Results

The following commands were freshly executed in the workspace:

| Verification Task      | Exact Command                            |                    Result                    |
| :--------------------- | :--------------------------------------- | :------------------------------------------: |
| **API Client Tests**   | `pnpm --filter @nerdhub/api-client test` |            **PASS (14/14 tests)**            |
| **All Monorepo Tests** | `pnpm turbo run test --force`            | **PASS (7/7 packages, 16 suites, 31 tests)** |
| **Code Formatting**    | `pnpm format:check`                      |     **PASS (All files Prettier-clean)**      |
| **Linting**            | `pnpm lint`                              |       **PASS (0 errors, 7 packages)**        |
| **Typechecking**       | `pnpm typecheck`                         |       **PASS (0 errors, 7 packages)**        |
| **Package Builds**     | `pnpm turbo run build --force`           |         **PASS (5/5 build targets)**         |
| **Git Hygiene**        | `git diff --check`                       |   **PASS (Clean, zero whitespace issues)**   |

---

## 5. ADR 0008 Readiness

[ADR 0008 — M1 Identity Session and Desktop Auth Architecture](../../architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md) has been fully updated:

- Incorporates finalized Decisions M1-P-01 through M1-P-04.
- Incorporates all resolved architectural conditions.
- Status is maintained as **Proposed (Ready for Owner Acceptance)**.

**Determination:** ADR 0008 is complete, defensible, and ready for the project owner to mark as **Accepted**.

---

## 6. Implementation Authorization

**Status:** ❌ **BLOCKED / NOT AUTHORIZED**

In accordance with strict change discipline:

- No authentication endpoints have been implemented.
- No identity Prisma migrations have been created.
- No OAuth integration has been wired.
- No desktop authentication UI has been added.

**To Unblock M1 Implementation:**

1. The project owner reviews this report and marks [ADR 0008](../../architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md) as **Accepted**.
2. The project owner issues formal authorization to begin Phase 1 of the [Implementation Plan](../identity/IMPLEMENTATION_PLAN.md).

---

_Report prepared by:_  
**Principal Software Architect & Engineering Lead**  
NerdHub Core Team
