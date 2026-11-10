# M1 Identity & Onboarding — Product Decision Register

> **Document Status:** APPROVED
> **Milestone:** M1 — Identity and Onboarding
> **Last Updated:** 2026-11-10
> **Notice:** All decisions below were explicitly approved by the project owner on 2026-11-10. These recommendations are now settled and govern M1 implementation.

---

## Decision Status Summary

| Decision ID | Area                       | Proposed Default                                                                         | Status                    |
| :---------- | :------------------------- | :--------------------------------------------------------------------------------------- | :------------------------ |
| **M1-P-01** | Email Verification Gating  | Login and browsing permitted; public posting and community actions gated until verified. | **ACCEPTED (2026-11-10)** |
| **M1-P-02** | OAuth Account Provisioning | Auto-provision only with verified provider email; never auto-link on email match.        | **ACCEPTED (2026-11-10)** |
| **M1-P-03** | Session Lifetimes          | 15m access token; 30d idle refresh lifetime; 90d absolute session maximum.               | **ACCEPTED (2026-11-10)** |
| **M1-P-04** | Username / Handle Policy   | Normalized lowercase ASCII `^[a-z0-9_]{3,30}$`; immutable during M1.                     | **ACCEPTED (2026-11-10)** |

---

## Decision M1-P-01 — Email Verification Gating

### Decision (Approved by Project Owner — 2026-11-10)

- **Permitted Prior to Verification:** Account login, profile viewing/setup, topic browsing, and read-only consumption of public discussions.
- **Gated Until Verified:** Public posting, commenting, voting/reactions, direct messaging, topic creation, and idea submissions strictly require email verification.
- **Backend Authority:** Gating is strictly enforced by server-side policy guards at the NestJS API boundary, not merely by hiding controls in the desktop UI.

### History & Evaluation

- **Recommendation:** Allow login and browsing; gate public community mutations until verified.
- **Alternatives Considered:**
  - _Hard gate (rejected):_ Blocking login completely maximizes anti-spam assurance but damages user activation and increases drop-off.
  - _No gate (rejected):_ Allowing all actions prior to verification leaves community feeds vulnerable to disposable email bot farms.
  - _Soft gate + rate limits (rejected):_ Complex velocity heuristic rules add maintenance overhead without strong abuse guarantees.
- **Security Implications:** Limits the blast radius of unverified accounts. Attackers registering arbitrary or unowned emails cannot publish spam, manipulate reputation, or harass users.
- **Technical Consequences:**
  - `users.email_verified` (boolean, default `false`) and `users.email_verified_at` (nullable timestamptz).
  - `EmailVerifiedGuard` applied to mutating community controllers.
  - Verification tokens stored as SHA-256 hashes in `auth_tokens` (24-hour expiration).
  - Resend endpoint protected by distributed Redis rate limiting (see [Security Requirements](../../engineering/identity/SECURITY_REQUIREMENTS.md)).

---

## Decision M1-P-02 — OAuth Account Provisioning & Linking

### Decision (Approved by Project Owner — 2026-11-10)

- **Auto-Provisioning:** User accounts are automatically provisioned upon external OAuth authentication **only when the provider supplies a cryptographically verified email address**.
- **Provider Account Anchor:** External identities are mapped strictly by `(issuer, subject)` (e.g. `(github, numeric_id)`, `(google, sub)`).
- **Prohibition of Automatic Linking:** The API **never automatically links** an OAuth provider to an existing account based on a matching email address.
- **Hidden / Unverified Emails:** When an OAuth provider does not return a verified email (e.g. private GitHub email), the user must supply and verify an email address via a separate verification challenge before community permissions are granted.
- **Account Collision Workflow:** When an OAuth email matches an existing account, the API returns HTTP `409 Conflict` (`ACCOUNT_COLLISION`) with an opaque collision token, initiating an explicit reauthentication linking process.

### History & Evaluation

- **Alternatives Considered:**
  - _Automatic linking on email match (rejected - high security risk):_ Vulnerable to account pre-hijacking where an attacker registers with a victim's email, waiting for the victim to sign in via OAuth.
  - _Manual-only registration (rejected):_ Disallowing auto-creation increases friction and negates OAuth convenience.
- **Security Implications:** Prevents OAuth account takeover attacks. Establishes cryptographic proof of ownership for both authentication factors before binding.
- **Technical Consequences:**
  - `oauth_accounts` table storing `(user_id, provider, provider_subject, provider_email)`.
  - Collision state machine with single-use collision tokens (10-minute expiration).
  - Reauthentication required via password (for credentialed accounts) or original provider / email challenge (for passwordless accounts).

---

## Decision M1-P-03 — Session Lifetimes & Revocation

### Decision (Approved by Project Owner — 2026-11-10)

- **Access Token Lifetime:** 15 minutes (stateless signed JWT).
- **Refresh Token Idle Lifetime:** 30 days (sliding expiration).
- **Session Absolute Lifetime:** 90 days (hard ceiling regardless of activity).
- **Max Concurrent Sessions:** 5 active sessions per user (oldest session automatically terminated on 6th login).
- **Revocation Behavior:**
  - _Single Logout:_ Revokes current session family in PostgreSQL and increments session version in Redis.
  - _Global Logout ("Sign out all devices"):_ Revokes all user sessions in PostgreSQL and increments global user session version in Redis.
  - _Compromised Session (Replay Detection):_ Presenting an already-consumed refresh token immediately revokes the entire token family, increments session version, and records an auditable security event.

### History & Evaluation

- **Alternatives Considered:**
  - _Shorter lifetimes (5m / 7d / 30d):_ Higher refresh frequency with negligible security benefit for desktop usage.
  - _Longer lifetimes (60m / 90d / 1y):_ Extended revocation window and increased window of vulnerability if an access token is compromised.
  - _Opaque access tokens:_ Forced a database or Redis round-trip on every API request.
- **Security Implications:** Combines stateless JWT performance with bounded revocation ($\le 15$ minutes) via Redis session-version checks. Bounded absolute lifetime prevents abandoned workstations from retaining perpetual access.
- **Technical Consequences:**
  - JWT carries `session_version`, `session_id`, `sub`, and `exp` (15m).
  - Refresh tokens stored strictly as SHA-256 hashes (never plaintext, never Argon2id).
  - Redis caches `session:{id}:version`. In the event of a Redis outage, auth degrades gracefully to signature/expiry verification with logged alerts.

---

## Decision M1-P-04 — Username / Handle Policy

### Decision (Approved by Project Owner — 2026-11-10)

- **Format Regex:** Lowercase ASCII `^[a-z0-9_]{3,30}$`.
- **Normalization:** Normalized to lowercase on input; case-insensitive uniqueness enforced via database index.
- **Immutability in M1:** Handles are strictly immutable once created during Milestone M1. Renaming workflows with redirects and cooldowns are deferred to M2+.
- **Separation of Display Name:** Display names remain independent and editable (free-form Unicode, up to 50 characters, spaces and mixed case permitted).
- **Reserved Names:** The API enforces a reserved-word dictionary rejecting administrative, protocol, and brand names (`admin`, `nerdhub`, `mod`, `api`, `system`, `root`, `support`, `security`, `staff`, `help`).

### History & Evaluation

- **Alternatives Considered:**
  - _Mutable handles in M1 (rejected):_ Requires complex mention redirect tables, tombstone records, and handle-poaching defenses before core social feeds exist.
  - _Unicode handles (rejected):_ Introduces severe visual spoofing and homograph collision risks (e.g. Cyrillic vs Latin characters).
- **Security Implications:** Eliminates homograph attacks and URL encoding ambiguities. Immutability ensures durable attribution across posts, comments, and audit logs.
- **Technical Consequences:**
  - `profiles.handle` unique constraint with case-insensitive index.
  - Database check constraint enforcing regex `^[a-z0-9_]{3,30}$`.
  - Reserved handle validation in registration and profile creation schemas.

---

## Additional Operational Selections Pending Launch Review

The following operational selections are noted for pre-launch infrastructure staging:

1. **Transactional Email Provider:** Postmark or AWS SES with DKIM/SPF/DMARC alignment.
2. **Data Retention Policy:** 30-day soft-delete grace period before irreversible cryptographic erasure of user credentials.
