# M1 Identity & Onboarding — Acceptance Criteria

> **Document Status:** PROPOSED
> **Milestone:** M1 — Identity and Onboarding
> **Last Updated:** 2026-11-09

---

## 1. Resolution Criteria for Review Findings

### 1.1 M1-CRIT-01: Refresh Token Concurrency & Rotation

- [ ] Concurrent refresh calls in desktop client share a single in-flight promise via client mutex.
- [ ] Server executes refresh rotation inside a single PostgreSQL transaction with row lock (`SELECT FOR UPDATE`).
- [ ] Presenting a consumed refresh token immediately revokes all sessions in the family (`revoked_at = NOW()`) and increments `session_version`.
- [ ] Idempotent retries with the same `Idempotency-Key` return the cached response without double rotation.
- [ ] Refresh tokens are stored in the database strictly as SHA-256 hashes (never plaintext).
- [ ] Mid-flight database failure cleanly rolls back the transaction, leaving the existing refresh token valid for retry.

### 1.2 M1-CRIT-02: Argon2id Concurrency & Threadpool Bounds

- [ ] Argon2id parameters benchmarked and set to: memory 64 MiB, iterations 3, parallelism 1 lane.
- [ ] Application-level semaphore limits concurrent hashing operations to a maximum of 4.
- [ ] Hashing queue depth is capped at 8; requests beyond queue depth receive HTTP 429 or 503 without blocking.
- [ ] Execution timeout of 5 seconds releases the semaphore slot if a hash operation hangs.
- [ ] Unrelated API requests (`/api/v1/health`, `/api/v1/readiness`, public queries) remain responsive with sub-100ms latency during an authentication flood.
- [ ] `UV_THREADPOOL_SIZE=16` is documented and configured prior to Node.js runtime initialization.

### 1.3 M1-HIGH-01: Desktop OAuth Transport (`nerdhub://auth/callback`)

- [ ] PKCE `code_challenge` / `code_verifier` (S256) enforced on all authorization requests.
- [ ] `state` parameter is cryptographically random (256-bit entropy), stored with a 5-minute TTL, and validated before code exchange.
- [ ] OIDC `nonce` is validated against provider claims for Google OpenID Connect.
- [ ] Completion code carries a 60-second lifetime, is single-use, and requires the PKCE `code_verifier` to exchange.
- [ ] Neither the OAuth authorization code nor the access token is ever exposed in renderer-visible URLs.
- [ ] OS URI scheme registration is documented and automated for Linux, Windows, and macOS.

### 1.4 M1-HIGH-02: OAuth Account Collision State Machine

- [ ] OAuth sign-in matching an existing password account returns HTTP `409 Conflict` with code `ACCOUNT_COLLISION` and an opaque collision token.
- [ ] Automatic account linking based solely on email is strictly prohibited.
- [ ] Linking requires reauthentication by submitting the password of the existing account.
- [ ] Expired (>10 minutes) or replayed collision tokens are rejected.
- [ ] Unauthenticated collision responses do not reveal account existence beyond provider claims.

### 1.5 M1-HIGH-03: Email Verification Resend Abuse Controls

- [ ] Verification resend endpoint enforces Redis distributed rate limiting: max 3/hour per account, max 3/hour per destination email, max 10/hour per IP.
- [ ] Cooldown window of 60 seconds is enforced between resend attempts to the same destination.
- [ ] Resend responses are enumeration-resistant, returning identical generic messaging regardless of whether the email is registered, verified, or unknown.
- [ ] Rapid identical resend requests with matching idempotency keys return cached responses without dispatching duplicate emails.

### 1.6 M1-HIGH-04: Bounded Access Token Revocation & Redis Outage Policy (Issue 1)

- [ ] Access token JWT lifetime is bounded to exactly 15 minutes.
- [ ] Each JWT contains a `session_version` claim checked against Redis on authenticated requests.
- [ ] Session revocation (logout, password reset, token reuse detection) increments the `session_version` in Redis.
- [ ] Subsequent requests bearing the old `session_version` are rejected with HTTP 401.
- [ ] **Redis outage — fail-closed for writes and sensitive operations:** during a Redis outage, all write/mutation operations, sensitive account operations (password change, email change, linked-account management), account recovery (password-reset and verification-token redemption), session management (sign-out, sign-out-all-devices, refresh rotation, viewing/revoking sessions), and community actions (posting, commenting, reactions, follows, topic creation, direct messaging) are rejected with HTTP 401 or 503; revocation state is never assumed absent.
- [ ] **Redis outage — degraded read-only only on approved endpoints:** read-only operations may fall back to JWT signature + expiry verification only on an explicitly maintained allow-list of read-only endpoints; sensitive user data is never returned without session-version validation.
- [ ] **Redis outage — bounded exposure:** a revoked session that slips through during a Redis outage acts for at most the remaining lifetime of its access token, never exceeding 15 minutes.
- [ ] **Redis outage — logging & monitoring:** every authenticated request served during a Redis outage is logged at `warn` level with `redis_unavailable=true` and increments failure telemetry; high-severity alerts fire on Redis unreachability; degraded authentication is never silent.
- [ ] **Redis outage — recovery:** when Redis returns, full session-version validation resumes automatically; revocations durably recorded in PostgreSQL are reconciled into Redis; degraded-read-only mode ends automatically once Redis health checks pass consecutively.

### 1.7 Refresh Token Idempotency & Response Cache (Issue 2)

- [ ] Refresh tokens carry 256 bits of CSPRNG entropy.
- [ ] Refresh tokens are stored in PostgreSQL strictly as SHA-256 digests; plaintext refresh tokens are never persisted.
- [ ] Redis never contains recoverable plaintext refresh tokens.
- [ ] Idempotency cache entries are protected with authenticated encryption (AES-256-GCM or XChaCha20-Poly1305) using a dedicated `REFRESH_IDEMPOTENCY_CACHE_KEY` (≥256 bits) loaded from a backend secret store at process startup.
- [ ] The cache encryption key is never stored alongside the encrypted values it protects.
- [ ] Cache encryption key is rotated at least every 90 days and immediately upon any suspected compromise.
- [ ] Cached rotation responses expire after 30 seconds and are never extended.
- [ ] Same consumed refresh token + same `Idempotency-Key` (within TTL): returns the cached original rotation result; does not create another successor token; does not revoke the family.
- [ ] Same consumed refresh token + different `Idempotency-Key`: treated as possible replay; the entire token family is revoked, session version incremented, security event recorded, and re-authentication forced.
- [ ] Concurrent refresh requests serialize on a PostgreSQL row lock (`SELECT FOR UPDATE`); it is impossible for two valid successor tokens to exist for the same rotation.
- [ ] Cache is best-effort: a Redis outage during rotation proceeds with the database rotation and skips caching; a cache miss never causes a double rotation.
- [ ] Mid-flight database failure cleanly rolls back the transaction, leaving the existing refresh token valid for retry.

### 1.8 Maximum Concurrent Sessions — Five-Session Cap (Issue 3)

- [ ] A user may have at most 5 active sessions at any time.
- [ ] First five logins create five active sessions with no eviction.
- [ ] Sixth login evicts the oldest active session, ordered by `created_at` ascending, with `session_id` (UUID) ascending as the deterministic tie-break.
- [ ] Eviction and new-session creation commit atomically in a single transaction; any failure rolls back both.
- [ ] The user is notified which session was signed out (creation timestamp and available device/location hints).
- [ ] Already-revoked sessions do not count toward the cap and are never eviction candidates.
- [ ] Concurrent login attempts for the same user serialize and result in at most five active sessions.
- [ ] Notification delivery failure does not block session creation or eviction.

---

## 2. Product Journey Acceptance Criteria

### 2.1 Registration & Verification

- [ ] User can register with valid email, password ($\ge 12$ chars), and handle.
- [ ] Verification email is enqueued to BullMQ and processed by the worker.
- [ ] Verification link marks `email_verified = true` in PostgreSQL.
- [ ] Unverified user can log in and view discussions, but cannot create posts or comments (per M1-P-01).

### 2.2 Profile & Onboarding

- [ ] Handle validation enforces lowercase ASCII `[a-z0-9_]{3,30}` and rejects reserved system handles.
- [ ] User can select 3 or more interests from the curated catalogue.
- [ ] User can explicitly choose "Skip for now", landing on the general discovery feed.
- [ ] Interrupted onboarding automatically resumes at the pending step upon subsequent login.

---

## 3. Security & Operational Criteria

- [ ] All API responses adhere to the standard response envelope `{ data, meta: { requestId } }` (MED-03).
- [ ] All errors return safe envelopes without leaking database errors, stack traces, or internal server details.
- [ ] Passwords and secrets are redacted from application logs.
- [ ] No secrets exist in the compiled Tauri desktop bundle.
- [ ] All automated unit, integration, and security test suites pass cleanly.
