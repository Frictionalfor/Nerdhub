# M1 Identity Security Requirements

> **Document Status:** PROPOSED
> **Milestone:** M1 — Identity and Onboarding
> **Module:** Security & Trust Boundaries
> **Last Updated:** 2026-11-09

---

## 1. Core Trust Boundaries

All security-critical decisions are authoritative on the server:

1. **Client Untrusted:** The desktop renderer is an untrusted environment. It must never evaluate permissions, attest verification state, or bypass server guards.
2. **Secret Containment:** No server secrets (OAuth client secrets, JWT signing private keys, internal service tokens) may ever be embedded in desktop bundles, IPC responses, or client logs.
3. **Database Ledger Integrity:** All security events (failed logins, token reuse alerts, password changes, account linking) are committed to an append-only `security_events` table.

---

## 2. Cryptographic Controls

### 2.1 Password Hashing (Argon2id)

- **Algorithm:** Argon2id (RFC 9106).
- **Parameters:** Memory $m = 65,536\text{ KiB}$ (64 MiB), Iterations $t = 3$, Parallelism $p = 1$.
- **Password Policy:** Minimum length 12 characters, maximum length 128 characters. No arbitrary symbol/digit complexity rules (NIST SP 800-63B compliant).
- **Concurrency Protection:** Backend semaphore bounds concurrent hashing to 4 instances with queue depth 8 to prevent threadpool starvation.

### 2.2 Token Generation & Storage

- **Refresh Tokens:** 256 bits of CSPRNG entropy; stored in PostgreSQL strictly as **hex-encoded SHA-256** digests. Plaintext refresh tokens are never persisted.
- **Verification & Reset Tokens:** 256 bits of CSPRNG entropy; stored as SHA-256 digests in `auth_tokens`.
- **Completion Codes:** Single-use, 60-second lifetime, stored as SHA-256 digests.

### 2.3 Access Token Signing

- Signed using asymmetric RS256 or Ed25519 (or symmetric HS256 with 256-bit server secret during local development).
- Token carries `sub` (user UUID), `session_id`, `session_version`, `jti`, and `exp` (15 minutes).

### 2.4 Session Concurrency & Revocation (M1-P-03)

- **Maximum concurrent sessions:** 5 active sessions per user.
- **Session eviction:** On a sixth session, the oldest active session is evicted deterministically (ordered by `created_at` ascending, `session_id` UUID ascending as tie-break), revoked atomically within the same transaction that creates the new session, and the user is notified which session was signed out.
- **Already-revoked sessions** do not count toward the cap and are never eviction candidates.
- **Revocation behavior:** single logout revokes the current session family; global logout revokes all user sessions; token replay immediately revokes the family and logs a security incident.
- **Session version:** each session carries a `session_version` integer cached in Redis (`session:{id}:version`). Revocation increments the version; JWTs bearing a stale version are rejected (HTTP 401).

### 2.5 Redis Outage & Session Revocation (Issue 1 — Fail-Closed)

- **Fail-closed operations:** during a Redis outage, all write/mutation operations, sensitive account operations (password change, email change, linked-account management), account recovery (password-reset and verification-token redemption), session management (sign-out, sign-out-all-devices, refresh rotation, viewing/revoking sessions), and community actions (posting, commenting, reactions, follows, topic creation, direct messaging) are rejected with HTTP 401 or 503. Revocation state is never assumed absent.
- **Degraded read-only access:** read-only operations may fall back to JWT signature + expiry verification **only** on an explicitly maintained allow-list of read-only endpoints. Sensitive user data is never returned without session-version validation.
- **Bounded exposure:** a revoked session that slips through during a Redis outage acts for at most the remaining lifetime of its access token, never exceeding 15 minutes.
- **Logging & monitoring:** every authenticated request served during a Redis outage is logged at `warn` level with `redis_unavailable=true` and increments failure telemetry; high-severity alerts fire on Redis unreachability. Degraded authentication is never silent.
- **No silent success:** Redis failure is treated as "unable to confirm revocation," never as "revocation confirmed absent."
- **Recovery:** when Redis returns, full session-version validation resumes automatically; revocations durably recorded in PostgreSQL are reconciled into Redis; degraded-read-only mode ends once Redis health checks pass consecutively.

### 2.6 Refresh Token Idempotency & Response Cache (Issue 2)

- Refresh tokens carry 256 bits of CSPRNG entropy and are stored strictly as SHA-256 digests (never plaintext).
- Redis never contains recoverable plaintext refresh tokens.
- Idempotency cache entries (rotation response envelopes) are protected with authenticated encryption (AES-256-GCM or XChaCha20-Poly1305) using a dedicated `REFRESH_IDEMPOTENCY_CACHE_KEY` (≥256 bits) loaded from a backend secret store at process startup.
- The cache encryption key is never stored alongside the encrypted values it protects; it is rotated at least every 90 days and immediately upon any suspected compromise.
- Cache entries expire after 30 seconds and are never extended.
- Same consumed refresh token + same `Idempotency-Key` (within TTL): returns the cached original rotation result; no new successor token; family not revoked.
- Same consumed refresh token + different `Idempotency-Key`: treated as possible replay; entire token family revoked, session version incremented, security event recorded, re-authentication forced.
- Cache is best-effort: a Redis outage during rotation proceeds with the database rotation and skips caching; a cache miss never causes a double rotation.

---

## 3. Distributed Abuse Prevention & Rate Limiting (Finding M1-HIGH-03)

Rate limiting is enforced globally using Redis sliding-window counters:

| Endpoint Family                         | Rate Limit Scope     | Threshold               | Mitigation Action                   |
| :-------------------------------------- | :------------------- | :---------------------- | :---------------------------------- |
| `POST /auth/login`                      | IP Address           | 10 failures / minute    | 429 Too Many Requests               |
| `POST /auth/login`                      | Account (Email Hash) | 5 failures / 15 minutes | Account lockout + progressive delay |
| `POST /auth/register`                   | IP Address           | 5 registrations / hour  | 429 Too Many Requests               |
| `POST /auth/email-verification/request` | Destination Email    | 3 requests / hour       | Cooldown (60s) + generic response   |
| `POST /auth/email-verification/request` | IP Address           | 10 requests / hour      | 429 Too Many Requests               |
| `POST /auth/refresh`                    | Session ID           | 30 rotations / hour     | Flag abnormal activity              |

### Enumeration Resistance

All unauthenticated endpoints (`register`, `login`, `email-verification/request`, `password-reset/request`) return uniform, generic responses and constant-time dummy hashing when an account does not exist to prevent username and email harvesting.

---

## 4. Tauri Desktop Security & IPC Controls

1. **IPC Command Whitelisting:** Tauri capabilities explicitly restrict IPC calls to named handlers (`save_token`, `get_token`, `clear_token`, `open_browser`).
2. **Zero Direct Filesystem Access:** The desktop webview has no filesystem permissions; token persistence is mediated exclusively by native Rust OS keychain plugins.
3. **Deep-Link Protocol Protection:** The `nerdhub://` protocol handler validates the origin and parses only the expected `completion_code` parameter. The completion code exchange requires the PKCE verifier held in memory, neutralizing third-party URI interception.
