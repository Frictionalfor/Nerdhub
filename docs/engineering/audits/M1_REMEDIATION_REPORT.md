# M1 Remediation Report

> **Document Status:** HISTORICAL RECORD — KILO REMEDIATION REPORT (2026-11-09)
> **Remediation Status:** REMEDIATED, BLOCKED pending owner approval
> **Notice:** Preserved for historical audit trail.

**Milestone:** M1 — Identity and Onboarding
**M0 status:** Approved
**M1 status:** REMEDIATED, BLOCKED pending owner approval (not self-approved)
**Antigravity re-audit:** Pending
**Author:** Frictionalfor (swanand2008.08@gmail.com)
**No AI co-author attribution. No Co-authored-by trailers.**

## Summary

The independent M1 architecture review identified 2 Critical and 4 High
findings, plus one Medium item (MED-03, standard API response envelope) carried
forward from M0. This remediation:

- Documents a design and testable acceptance criteria for all six review
  findings (M1-CRIT-01/02, M1-HIGH-01/02/03/04).
- Implements MED-03 (standard API response envelope `{ data, meta: { requestId
} }` with `X-Request-Id` header, no double-wrapping) as runnable, tested code.
- Records four product decisions (M1-P-01..M1-P-04) as **PENDING** owner
  approval; none are treated as settled.
- Marks ADR 0008 **Proposed**, not Accepted, because owner decisions remain
  unresolved.

No M1 authentication endpoints, no final identity Prisma migration, and no
complete M1 authentication is implemented. The M0 architecture (modular
monolith, separate API/worker, PostgreSQL+Prisma, Redis+BullMQ, Tauri desktop)
is preserved unchanged.

## Finding-by-finding resolution

### M1-CRIT-01 — Refresh token rotation concurrency (Critical)

**Original finding:** Parallel refresh requests can trigger false reuse
detection and revoke legitimate sessions.

**Technical resolution:** Token-family rotation with client-side single-flight.

- Each refresh token belongs to a session family created at login.
- Rotation (consume old RT + issue new RT + increment session version) runs in
  one PostgreSQL transaction with `SELECT ... FOR UPDATE` on the RT row.
- Client keeps an in-flight map keyed by session/family; concurrent refresh
  requests share one in-flight promise.
- No grace window: a consumed RT never obtains a new token.
- Confirmed reuse (presented consumed RT) revokes the whole family and forces
  reauth.
- Idempotent refresh responses cached short-term (30s), encrypted, keyed by
  `idempotency_key + RT_hash`; the cache stores the response, never a plaintext
  RT. RTs stored as argon2id hashes only.
- Crash mid-rotation rolls back the transaction, leaving the old RT usable
  (client retries).

**Design decisions:**

- Single-flight client-side to prevent duplicate server rotation requests.
- Transactional consume+issue for atomicity.
- No grace window (explicitly rejected per reviewer guidance).

**Security implications:** Prevents false revocation of legitimate sessions and
detects genuine refresh-token theft/replay. Idempotency cache does not store
plaintext RTs.

**Files changed:** Documentation only

- `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md` (M1-CRIT-01 section)

**Tests performed:** None implemented (design only). Acceptance criteria listed
in the security document (concurrent refresh → one rotation; consumed RT → family
revoked; no grace window; idempotent retry → cached response; crash recovery;
RTs hashed).

**Test results:** N/A (design document; acceptance criteria to be implemented
during authorized M1 work).

**Remaining risks:** Requires implementation verification against a test DB.
Owner decisions M1-P-02 (OAuth provisioning) affects family creation at login.

**Owner decisions pending:** M1-P-02.

---

### M1-CRIT-02 — Argon2id threadpool starvation (Critical)

**Original finding:** Concurrent password hashing may exhaust Node.js worker
thread resources.

**Technical resolution:**

- `argon2` library, argon2id algorithm.
- Safe parameters: memory 64 MiB, iterations 3, parallelism 1 lane.
- Application-level semaphore caps concurrent hashes (e.g. 4) with queue depth
  (e.g. 8); excess auth requests get `429`/`503` without consuming a slot.
- Per-hash timeout (e.g. 5s) releases the semaphore slot on failure.
- Unrelated API requests (health/readiness/browsing) do not acquire the hash
  semaphore, so an auth flood cannot degrade them.
- `UV_THREADPOOL_SIZE` is NOT blindly set to 16; if changed it must be set
  before Node.js runtime initialization and paired with the app-level semaphore.

**Design decisions:**

- App-level semaphore is the primary control; `UV_THREADPOOL_SIZE` is secondary
  and pre-init only.
- 64 MiB × concurrency cap bounds worst-case hashing RAM.

**Security implications:** Prevents authentication floods from exhausting the
threadpool and denying service to unrelated endpoints.

**Files changed:** Documentation only

- `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md` (M1-CRIT-02 section)

**Tests performed:** None implemented (design only). Acceptance criteria listed
(semaphore cap, slot release on timeout, unrelated requests responsive during
flood, `UV_THREADPOOL_SIZE` documented, concurrency/load tests).

**Test results:** N/A (design document).

**Remaining risks:** Requires load-test verification; parameter tuning depends
on deployment hardware.

**Owner decisions pending:** None (parameter values are a documented baseline,
adjustable per deployment).

---

### M1-HIGH-01 — Desktop OAuth transport (High)

**Original finding:** The desktop authentication transport remains undecided.

**Technical resolution:** `nerdhub://auth/callback` custom URI scheme with:

- PKCE (`code_challenge`/`code_verifier`, S256) on every authorization request.
- `state` parameter (cryptographically random, bound to client session).
- OIDC `nonce` (when provider supports OIDC).
- One-time completion code: callback carries a short-lived (~5 min),
  single-use completion code; renderer exchanges it with the API for tokens.
- Callback verification: API validates `state`, `nonce`, `code_verifier`,
  completion-code one-time use before issuing tokens.
- Code expiration and replay prevention.
- Renderer token exposure: access/refresh tokens never in a renderer-visible
  URL; refresh via HttpOnly cookie, access in memory only.
- OS-specific URI scheme registration (Windows/macOS/Linux).

**Design decisions:** URI scheme chosen over loopback callback (no local web
server in renderer) and claimed HTTPS links (platform-specific, complex).

**Security implications:** Tokens never exposed in renderer URLs; PKCE/state/nonce
prevent authorization-code interception and replay; completion code is
single-use and short-lived.

**Files changed:** Documentation only

- `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md` (M1-HIGH-01 section)
- `M1_IDENTITY_ONBOARDING_PROPOSAL.md` (desktop OAuth sequence)

**Tests performed:** None implemented (design only). Acceptance criteria listed
(PKCE enforced, state validated, nonce validated, completion code expiry/replay,
no renderer-visible token URL, OS registration documented).

**Test results:** N/A (design document).

**Remaining risks:** OS URI scheme registration must be implemented and tested
per platform.

**Owner decisions pending:** M1-P-02 (OAuth provisioning affects the callback
flow).

---

### M1-HIGH-02 — OAuth account collision (High)

**Original finding:** An existing email/password user can collide with an
unlinked OAuth provider sign-in (same email).

**Technical resolution:**

- Collision states: `COLLISION_PENDING`, `COLLISION_RESOLVED_LINKED`,
  `COLLISION_RESOLVED_DENIED`.
- No automatic linking on email match.
- OAuth sign-in with matching email returns `409 ACCOUNT_COLLISION` with an
  opaque, short-lived (~10 min), single-use collision transaction token.
- Linking requires reauthentication (password for the existing account) to prove
  ownership.
- Expired/replayed collision tokens rejected; new flow required.
- No email enumeration: unauthenticated responses do not confirm/deny
  registration beyond what the OAuth provider disclosed.

**Design decisions:** Explicit collision state machine; ownership proven by
password reauthentication, not email match alone.

**Security implications:** Prevents account takeover via OAuth email collision;
no email enumeration.

**Files changed:** Documentation only

- `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md` (M1-HIGH-02 section)

**Tests performed:** None implemented (design only). Acceptance criteria listed
(409 with opaque token, no auto-link, reauth required, expired/replay rejected,
no enumeration).

**Test results:** N/A (design document).

**Remaining risks:** Requires implementation verification.

**Owner decisions pending:** M1-P-02 (auto-create vs link-only affects when
collisions arise).

---

### M1-HIGH-03 — Email verification resend abuse (High)

**Original finding:** Unauthenticated verification resend endpoints can be
abused for mailbox bombing.

**Technical resolution:**

- Distributed rate limiting via Redis (survives restarts, scales across API
  instances): per-account, per-destination (email), and per-IP limits.
- Cooldown policy (e.g. 60s between resends to same email).
- Enumeration-resistant responses: identical generic message regardless of
  whether the email is registered/verified/unknown.
- Resend idempotency via idempotency key (no duplicate email for repeated
  identical requests).
- Abuse monitoring/alerting and temporary IP blocklists for sustained abuse.

**Design decisions:** Redis-backed (not in-memory) so limits survive restarts
and scale; enumeration-resistant to prevent harvesting.

**Security implications:** Prevents mailbox bombing and email enumeration.

**Files changed:** Documentation only

- `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md` (M1-HIGH-03 section)

**Tests performed:** None implemented (design only). Acceptance criteria listed
(Redis limits, per-account/destination/IP, cooldown, enumeration-resistant,
idempotent, monitoring, repeated-request/bypass tests).

**Test results:** N/A (design document).

**Remaining risks:** Requires an email provider (SMTP/managed) before any
verification email can be sent; rate-limit threshold values need tuning.

**Owner decisions pending:** M1-P-01 (verification gating affects resend
semantics); email provider selection (additional decision).

---

### M1-HIGH-04 — Access token revocation (High)

**Original finding:** Stateless JWT behavior conflicts with real-time session
revocation requirements.

**Technical resolution:** Short-lived JWT (15 min) + Redis-backed bounded
session-version revocation.

- Access token JWT includes `session_version` claim.
- Redis stores current session version per user/session.
- Every authenticated request validates JWT signature/expiry AND compares JWT
  `session_version` against Redis; mismatch → 401.
- Revocation (sign-out, password change, security event, confirmed refresh
  reuse) increments the session version in Redis.
- Bounded revocation: effect within at most the access-token lifetime (15 min).
- Redis unavailable → JWT-only validation (signature + expiry), warning logged,
  metric/alert; revocation not enforceable while Redis down (documented
  trade-off).
- Does NOT claim immediate revocation with a purely stateless JWT.

**Design decisions:** JWT + distributed revocation records (chosen over opaque
tokens and purely stateless JWT) for bounded revocation with minimal per-request
cost.

**Security implications:** Revocation is bounded, not immediate; Redis
unavailability degrades to JWT-only (acceptable, documented).

**Files changed:** Documentation only

- `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md` (M1-HIGH-04 section)

**Tests performed:** None implemented (design only). Acceptance criteria listed
(revocation increments version → old JWT rejected; ≤15 min effect; Redis-down
degrade; sign-out/password-change/security-event increment version).

**Test results:** N/A (design document).

**Remaining risks:** Requires test Redis for integration tests; operational
runbook for Redis-down degradation.

**Owner decisions pending:** M1-P-03 (session lifetimes affect the 15-min bound).

---

### MED-03 — Standard API response envelope (Medium)

**Original finding:** API responses lack a consistent envelope and request ID.

**Technical resolution:** Implemented `ResponseEnvelopeInterceptor` (NestJS
`NestInterceptor`) registered globally via `APP_INTERCEPTOR`:

- Wraps every successful handler result in `{ data: T, meta: { requestId } }`.
- Responses already carrying `{ data, meta }` pass through unchanged (no
  double-wrapping).
- Request ID propagated from `x-request-id` request header (configurable via
  `REQUEST_ID_HEADER`), fallback `x-amzn-requestid`, then
  `crypto.randomUUID()`.
- `X-Request-Id` response header set on every response; `meta.requestId`
  echoes it.
- `HttpExceptionFilter` also sets `X-Request-Id` for success/error
  consistency.
- Health and readiness wrapped in the same envelope (semantics preserved in
  `data`).
- Error responses keep the `{ error: { code, message, details?, requestId } }`
  shape (produced by the filter, not the interceptor).
- API client already extracts `data`/`meta` from the envelope (no client
  change required).

**Files changed:**

- `apps/api/src/common/interceptors/response-envelope.interceptor.ts` (new)
- `apps/api/src/common/interceptors/index.ts` (new)
- `apps/api/src/common/interceptors/response-envelope.interceptor.test.ts` (new)
- `apps/api/src/health/response-envelope.integration.test.ts` (new)
- `apps/api/src/app.module.ts` (register APP_INTERCEPTOR)
- `apps/api/src/common/exceptions/http-exception.filter.ts` (set X-Request-Id header)
- `apps/api/src/common/exceptions/http-exception.filter.test.ts` (add setHeader to mocks)
- `docs/architecture/API_CONVENTIONS.md` (document envelope + X-Request-Id)

**Design decisions:** Global interceptor for consistency; `APP_INTERCEPTOR`
provider in AppModule; already-enveloped responses pass through.

**Security implications:** Request ID enables request tracing and correlation of
client reports with server logs; no sensitive data in `meta`.

**Tests performed:**

- Unit tests (5): wrap plain data, propagate x-request-id, fall back to
  x-amzn-requestid, generate request ID when absent, no double-wrap.
- Integration tests (2): supertest against real NestJS app wrapping health in
  envelope + X-Request-Id header; client-supplied x-request-id propagated.
- Existing API tests still pass (health controller direct-call, exception
  filter).

**Test results:** 10/10 API tests pass (4 suites).

**Runtime verification:** `GET /api/v1/health` returns HTTP 200 with
`X-Request-Id` header and body
`{"data":{...},"meta":{"requestId":"..."}}` where `meta.requestId` matches the
header. SIGTERM graceful shutdown confirmed (exit 0).

**Remaining risks:** None for MED-03; health/readiness wrapped in envelope is
intentional and consistent with API_CONVENTIONS.md.

**Owner decisions pending:** None.

---

## Files changed (this remediation)

| File                                                                          | Change                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/src/common/interceptors/response-envelope.interceptor.ts`           | New: NestJS response envelope interceptor                  |
| `apps/api/src/common/interceptors/index.ts`                                   | New: barrel export                                         |
| `apps/api/src/common/interceptors/response-envelope.interceptor.test.ts`      | New: unit tests (5)                                        |
| `apps/api/src/health/response-envelope.integration.test.ts`                   | New: supertest integration tests (2)                       |
| `apps/api/src/app.module.ts`                                                  | Register APP_INTERCEPTOR globally                          |
| `apps/api/src/common/exceptions/http-exception.filter.ts`                     | Set X-Request-Id header on error responses                 |
| `apps/api/src/common/exceptions/http-exception.filter.test.ts`                | Add setHeader to mock responses                            |
| `docs/architecture/API_CONVENTIONS.md`                                        | Document envelope, X-Request-Id, health/readiness wrapping |
| `M1_IDENTITY_ONBOARDING_PROPOSAL.md`                                          | New: M1 scope, trust boundaries, sequences                 |
| `M1_IDENTITY_SECURITY_AND_ACCEPTANCE.md`                                      | New: all six findings resolved + acceptance criteria       |
| `M1_IDENTITY_ONBOARDING_PRODUCT_DECISIONS.md`                                 | New: 4 product decisions, all PENDING                      |
| `docs/architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md` | New: ADR 0008, status Proposed                             |
| `docs/engineering/PROJECT_STATUS.md`                                          | Updated: M1 remediated/blocked, MED-03 complete            |

## Dependencies added, removed, or upgraded

None. No new runtime dependencies introduced. MED-03 uses only existing
NestJS (`@nestjs/common`, `@nestjs/core`), Node `crypto`, and RxJS.

## Regression verification (executed)

| Check     | Command                          | Result                          |
| --------- | -------------------------------- | ------------------------------- |
| Install   | `pnpm install --frozen-lockfile` | Pass                            |
| Format    | `pnpm format:check`              | Pass (all files Prettier-clean) |
| Lint      | `pnpm lint`                      | Pass (7/7 packages, 0 errors)   |
| Typecheck | `pnpm typecheck`                 | Pass (7/7 packages)             |
| Tests     | `pnpm test`                      | Pass (7/7 packages; API 10/10)  |
| Build     | `pnpm build`                     | Pass (5/5 packages)             |

Runtime verified:

- `GET /api/v1/health` → HTTP 200, `X-Request-Id` header, envelope body.
- `meta.requestId` matches `X-Request-Id` header.
- API SIGTERM → graceful shutdown, exit 0 (Prisma disconnected, app closed).

## Remaining risks

- M1 designs are unimplemented; acceptance criteria must be verified during
  authorized M1 implementation (test DB, test Redis).
- Tauri native binary cannot be verified (no Rust toolchain in this
  environment).
- CI workflow not executed against GitHub Actions (no runner access); YAML
  validated syntactically only.
- Owner decisions M1-P-01..M1-P-04 unresolved → ADR 0008 stays Proposed → M1
  cannot be authorized for implementation.

## Owner decisions still pending

| Decision                  | ID       | Status   | Required before                     |
| ------------------------- | -------- | -------- | ----------------------------------- |
| Email verification gating | M1-P-01  | PENDING  | M1 implementation, resend semantics |
| OAuth provisioning        | M1-P-02  | PENDING  | M1 implementation, collision flow   |
| Session lifetimes         | M1-P-03  | PENDING  | M1 implementation, revocation bound |
| Username policy           | M1-P-04  | PENDING  | M1 implementation                   |
| ADR 0008 acceptance       | ADR 0008 | Proposed | M1-P-01..P-04 resolved              |

M1 remains BLOCKED until the owner approves these decisions and authorizes
implementation. This remediation does not self-approve M1.
