# Session Architecture Specification

> **Document Status:** PROPOSED
> **Milestone:** M1 — Identity and Onboarding
> **Module:** Identity (Sessions)
> **Last Updated:** 2026-11-09

---

## 1. Dual-Token Architecture Overview

NerdHub implements a hybrid session architecture combining short-lived signed JSON Web Tokens (JWT) for high-performance stateless API verification with database-backed refresh token families for revocation and session lifecycle control.

```mermaid
flowchart LR
    subgraph Client["Desktop Client"]
        RAM["Memory Store<br/>(Access Token)"]
        Store["OS Secure Store<br/>(Refresh Token)"]
    end

    subgraph API["NestJS API"]
        Verify["JWT Signature Verification<br/>(Stateless)"]
        RedisCheck["Redis Version Lookup<br/>(Sub-millisecond)"]
    end

    subgraph State["Backend State"]
        PG[("PostgreSQL<br/>Session Families & History")]
        Redis[("Redis<br/>Active Session Versions")]
    end

    RAM -->|Authorization: Bearer JWT| Verify
    Verify --> RedisCheck
    RedisCheck -.->|Session Version Cache| Redis
    Store -->|POST /auth/refresh (RT)| PG
```

| Token Type        | Storage Location                              | Lifetime                   | Payload / Format                                                    | Revocation Mechanism                                     |
| :---------------- | :-------------------------------------------- | :------------------------- | :------------------------------------------------------------------ | :------------------------------------------------------- |
| **Access Token**  | Client process memory                         | 15 minutes                 | Signed JWT (`sub`, `jti`, `session_id`, `session_version`)          | Bounded (≤ 15m) via Redis `session_version` invalidation |
| **Refresh Token** | OS Credential Store (Tauri) / HttpOnly Cookie | 30 days idle / 90 days max | Cryptographically random 256-bit string; stored as **SHA-256 hash** | Immediate upon rotation, reuse detection, or sign-out    |

---

## 2. Refresh Token Concurrency & Rotation (Finding M1-CRIT-01)

### 2.1 The Concurrency Challenge

In modern desktop single-page applications, views frequently fire parallel API requests upon mount (e.g. fetching user profile, unread notifications, and latest feed). When an access token expires, multiple parallel requests will simultaneously encounter HTTP 401 and attempt to refresh the session using the same refresh token.

### 2.2 Client-Side Single-Flight Mutex

To prevent multiple refresh requests from reaching the server:

- The desktop API client maintains an internal promise map keyed by `session_id`.
- The first failed request triggers a token refresh; all subsequent concurrent 401 requests hook into the same active refresh promise.
- Only one refresh HTTP call is dispatched over the network.

### 2.3 Server-Side Token Family Rotation & Atomic Transactions

When a refresh request reaches the server:

1. **Row-Level Lock:** The refresh operation begins a PostgreSQL transaction with:
   ```sql
   SELECT * FROM sessions WHERE id = $1 FOR UPDATE;
   ```
2. **Reuse Detection:**
   - The presented refresh token is hashed (SHA-256) and verified against the session's active token.
   - If the token matches the **previously consumed token**, the server flags **CONFIRMED REUSE**. The entire session family is revoked immediately, logging a security incident and forcing re-authentication.
3. **Atomic Consumption and Issuance:**
   - The active refresh token is marked as consumed.
   - A new cryptographically random refresh token is generated, hashed, and stored as the active token.
   - The session's `session_version` counter is incremented in both PostgreSQL and Redis.
   - A new 15-minute access token and the new refresh token are returned to the client.
4. **Idempotency Protection:**
   - Refresh requests carry an `Idempotency-Key` header.
   - For rapid retries within a 30-second window, the server returns the cached response associated with the idempotency key without initiating an additional rotation or revoking the family.
5. **Crash Recovery:**
   - If the database transaction fails or crashes mid-flight, the transaction rolls back completely. The original refresh token remains unconsumed and valid for client retry.

### 2.4 Cryptographic Hashing of Tokens (SHA-256 vs Argon2id)

- **Refresh tokens are high-entropy secrets** (256 bits of cryptographically secure random bytes generated via CSPRNG).
- High-entropy tokens do not require memory-hard password hash functions. Storing refresh tokens with Argon2id would add 100–300 ms of CPU delay and threadpool saturation to every routine refresh operation.
- **Decision:** Refresh tokens are hashed using standard **SHA-256**. Argon2id is strictly reserved for user-chosen passwords.

### 2.5 Refresh Token Idempotency & Response Cache (Finding M1-CRIT-01 / Issue 2)

Refresh requests carry an `Idempotency-Key` header so that rapid client retries (e.g. after a network timeout where the server actually rotated successfully) do not cause duplicate rotations or spurious family revocations.

**Cache contents.** The idempotency cache stores the **rotation response envelope** (new access token + new refresh token + metadata) associated with the `Idempotency-Key`. The cache entry is keyed by the pair `(idempotency_key, refresh_token_hash)` so that a retry with the same key against the same consumed token returns the identical result.

**Encrypted storage.** Because a cached rotation response contains a freshly issued refresh token, the cached value MUST be protected with **authenticated encryption** before being written to Redis:

- Encryption: AES-256-GCM (or XChaCha20-Poly1305 where available), providing both confidentiality and integrity.
- Key: a dedicated `REFRESH_IDEMPOTENCY_CACHE_KEY` of at least 256 bits, loaded from a backend secret store / environment variable at process startup. The key is never persisted alongside the encrypted values it protects.
- Key rotation: the cache encryption key MUST be rotated at least every 90 days, and immediately upon any suspected compromise. Rotating the key renders previously cached (still-encrypted) entries undecryptable; such entries are treated as cache misses and re-rotated normally.
- TTL: cache entries expire after **30 seconds** and are never extended. After expiry, a retry with the same idempotency key is treated as a fresh request and subject to normal rotation/reuse logic.

**Exact replay behavior.** Because refresh tokens are consumed inside a transaction (Section 2.3), a second request presenting an already-consumed token cannot succeed a second rotation. The server distinguishes the two retry cases:

| Request context                                                           | Server behavior                                                                                                                                                           |
| :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Same consumed refresh token + **same** `Idempotency-Key` (within 30s TTL) | Return the **cached original rotation result** (access token + the _same_ successor refresh token). Do not create another successor token and do not revoke the family.   |
| Same consumed refresh token + **different** `Idempotency-Key`             | Treat as a **possible replay / token-reuse attack**. Revoke the entire token family, increment the session version, record a security event, and force re-authentication. |
| Fresh (unconsumed) refresh token + any `Idempotency-Key`                  | Normal atomic rotation (Section 2.3); cache the result under `(idempotency_key, new_token_hash)`.                                                                         |

**Concurrency guarantee.** Because token consumption and issuance execute inside a single PostgreSQL transaction with `SELECT FOR UPDATE` (Section 2.3), concurrent requests for the same session serialize on the row lock. Only the first request consumes the token and issues a successor; subsequent concurrent requests observe the consumed token and fall into one of the two replay rows above. It is therefore impossible for two valid successor tokens to exist for the same rotation.

**Cache / database consistency.** The idempotency cache is a performance optimization, not the source of truth. If Redis is unavailable during rotation, the server proceeds with the database rotation and skips caching (the cache is best-effort). A cache miss never causes a double rotation because the database transaction and row lock remain authoritative.

---

## 3. Bounded Revocation via Redis (Finding M1-HIGH-04)

### 3.1 Session Version Invalidation

Purely stateless JWTs cannot be revoked prior to their expiration without maintaining a server-side revocation list. NerdHub solves this by embedding a `session_version` integer in each JWT.

1. **Redis Storage:**
   - For every active session, Redis stores:
     ```
     session:{sessionId}:version = <integer>
     ```
2. **Per-Request Verification:**
   - The API validates the JWT cryptographic signature and `exp` timestamp.
   - The API performs a sub-millisecond check against Redis:
     ```typescript
     const currentVersion = await redis.get(`session:${jwt.sessionId}:version`);
     if (currentVersion !== null && parseInt(currentVersion, 10) !== jwt.sessionVersion) {
       throw new UnauthorizedException('Session has been revoked');
     }
     ```
3. **Revocation Actions:**
   - Password reset, manual logout, user suspension, or refresh-token reuse detection increments the `session_version` in both PostgreSQL and Redis.
   - Any outstanding access tokens bearing the old version are rejected instantly.

### 3.2 Operational Degradation During Redis Outages (Issue 1 — Fail-Closed Policy)

Redis caches the active `session_version` for bounded JWT revocation. When Redis is temporarily unavailable or unreachable, session-version validation cannot be performed, and the API MUST NOT silently treat Redis failure as successful validation.

**Fail-closed operations (session-version validation REQUIRED; rejected when Redis is down):**

The following categories MUST be rejected with HTTP 401 (or 503 if the API cannot confirm revocation state) during a Redis outage, because revocation state cannot be confirmed:

- **All write/mutation operations** (create, update, delete) on protected resources.
- **Sensitive account operations** (password change, email change, MFA/enrollment changes, linked-account management).
- **Account recovery** (password-reset redemption, verification-token redemption).
- **Session management** (sign-out, sign-out-all-devices, refresh token rotation, viewing/revoking active sessions).
- **Community actions** (posting, commenting, reactions, follows, topic creation, direct messaging, idea submissions).

These operations are safety-critical: allowing them without confirming the session version could let a revoked session act. They therefore **fail closed**.

**Degraded read-only access (explicitly approved endpoints only):**

Read-only operations MAY temporarily fall back to validating the JWT cryptographic signature and `exp` timestamp only, without the Redis session-version check, subject to ALL of the following constraints:

- **Approved endpoints only.** Degraded read-only access is restricted to an explicitly maintained allow-list of read-only endpoints (e.g. public topic browsing, public post/comment reading, public profile viewing, `GET /api/v1/health`, `GET /api/v1/readiness`). The allow-list is defined in source and reviewed before any change.
- **No sensitive user data.** Degraded read-only access MUST NOT return sensitive user data (private messages, account settings, email, billing, or any data scoped to the authenticated user) without successful session-version validation.
- **Maximum exposure 15 minutes.** Because access tokens are bounded to a 15-minute lifetime, a revoked session that slips through during a Redis outage can act for at most the remaining lifetime of its access token, never exceeding 15 minutes.
- **Logging and monitoring.** Every authenticated request served during a Redis outage MUST be logged at `warn` level with `redis_unavailable=true` and MUST increment failure telemetry metrics. High-severity operational alerts fire when Redis is unreachable. Degraded authentication is never silent.
- **Explicit failure signaling.** The API never returns a successful session-validation result solely because Redis is unreachable. Redis failure is treated as "unable to confirm revocation," not "revocation confirmed absent."

**Recovery behavior:**

When Redis becomes available again:

- The API resumes full session-version validation on the next authenticated request (no restart required).
- Any sessions revoked while Redis was down (via revocation events written to PostgreSQL) take effect once the `session:{sessionId}:version` cache is repopulated; the version increment is durable in PostgreSQL and is reconciled into Redis on recovery / on next access.
- Degraded-read-only mode ends automatically once Redis health checks pass consecutively.

---

## 4. Maximum Concurrent Sessions (Issue 3 — Five-Session Cap)

**Policy (M1-P-03):** A user may have at most **5 active sessions** at any time. Sessions are scoped per user and tracked in PostgreSQL (`sessions` table, one row per active refresh-token family).

**Eviction on sixth session.** When a user authenticates and would create a sixth active session:

1. The API queries the user's active sessions, ordered deterministically by `created_at` ascending (oldest first).
2. The **oldest active session** is identified deterministically.
3. The oldest session is revoked (`revoked_at = NOW()`, `session_version` incremented in PostgreSQL and Redis) within the same transaction that creates the new session.
4. The new session is created.
5. The operation is **transactionally safe**: session revocation and session creation commit atomically; on any failure the transaction rolls back and neither a revocation nor a creation takes effect.
6. The user is notified which session was signed out (via the login response and an in-app/session notice), including the revoked session's creation timestamp and (where available) device/location hints. The user is never left guessing which session disappeared.
7. The evicted session's access token remains valid only for its natural ≤15-minute lifetime; its refresh token is invalidated immediately.

**Ordering and tie-breaking.**

- Sessions are ordered by `created_at` (session family creation timestamp) ascending; the oldest is evicted first.
- **Tie resolution:** If two sessions share the same `created_at` to the millisecond, the tie is broken by the session's primary key (`session_id`, UUID) in ascending lexicographic order. This guarantees a fully deterministic eviction choice under all conditions.
- **Already-revoked sessions** are excluded from the active-session count and are never candidates for eviction; revoking an already-revoked session is a no-op.

**Scope of the cap.** The five-session cap applies per user across all clients/devices. It is enforced at session creation (login / OAuth sign-in / account linking). It is NOT enforced by evicting sessions on every request; eviction happens only at creation time.

**Acceptance criteria.**

- [ ] First five logins create five active sessions with no eviction.
- [ ] Sixth login evicts the oldest active session (by `created_at`, then `session_id` tie-break).
- [ ] Eviction is transactional: a failure during sixth-session creation leaves all prior sessions intact.
- [ ] Concurrent login attempts for the same user serialize and result in at most five active sessions.
- [ ] Already-revoked sessions do not count toward the cap and are not evicted.
- [ ] The user is notified which session was revoked.
- [ ] Notification delivery failure does not block session creation or eviction.
