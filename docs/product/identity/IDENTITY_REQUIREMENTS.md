# Identity Product Requirements

> **Document Status:** PROPOSED — PENDING OWNER APPROVAL
> **Milestone:** M1 — Identity and Onboarding
> **Module:** Identity
> **Last Updated:** 2026-11-09

---

## 1. Overview

The Identity module is the authoritative foundation for user registration, credential verification, federated authentication, and session lifecycle management across the NerdHub platform.

NerdHub requires server-authoritative authentication: all authentication tokens, session lifecycles, credential verifications, and permissions are determined exclusively by the NestJS API. The desktop renderer is an untrusted client that holds no server secrets and makes no authorization decisions.

---

## 2. User Registration & Email Verification

### 2.1 Registration Journeys

1. **Email & Password Registration:**
   - The user provides email address, password, and desired handle.
   - The API validates password complexity (minimum 12 characters, NIST SP 800-63B compliant).
   - If the email or handle is already registered, the API returns a generic response or an error code that does not enable mass account enumeration.
   - Upon successful submission, a user record is created with `email_verified = false`, credentials are saved to `password_credentials`, and an email verification job is dispatched via BullMQ.
2. **Federated OAuth Registration (GitHub / Google):**
   - The user selects "Sign in with GitHub" or "Sign in with Google".
   - Authentication is negotiated via external browser with PKCE and custom URI callback (`nerdhub://auth/callback`).
   - If the provider email is verified, the user account is provisioned automatically with `email_verified = true` (subject to [Decision M1-P-02](PRODUCT_DECISIONS.md#decision-m1-p-02--oauth-account-provisioning)).
   - If the provider email is hidden or unverified, the user must supply and verify an email during onboarding.

### 2.2 Verification Gating

- Per [Decision M1-P-01](PRODUCT_DECISIONS.md#decision-m1-p-01--email-verification-gating), unverified users may log in, edit their profile, and browse public discussions.
- Public mutations (creating posts, commenting, voting, topic creation) are gated until the verification link is clicked.
- Verification tokens are cryptographically secure (256-bit entropy), stored as SHA-256 hashes, single-use, and expire after 24 hours.

---

## 3. Authentication & Sign-In

### 3.1 Credential Verification

- Passwords are validated using Argon2id.
- Password hashing is subject to concurrency bounds and execution timeouts to protect the backend runtime (see [Identity Architecture](../../architecture/identity/IDENTITY_ARCHITECTURE.md)).
- Invalid credentials return a generic error message (`INVALID_CREDENTIALS`) with identical execution timing to resist username enumeration.

### 3.2 Multi-Device Sessions

- A user may be concurrently signed in across multiple devices (e.g. laptop, desktop workstation).
- Each session has an independent cryptographic refresh token family and unique `family_id`.
- The server enforces a maximum of 5 concurrent sessions per account. Logging in from a 6th device automatically revokes the oldest idle session.

### 3.3 Sign-Out Behavior

1. **Single Session Sign-Out:**
   - The user clicks "Sign Out".
   - The server revokes the current session's refresh token family in PostgreSQL and increments the `session_version` in Redis.
   - The desktop client clears memory-stored access tokens and removes stored credentials.
2. **Global Sign-Out ("Sign out of all devices"):**
   - The server revokes all active sessions for the user in PostgreSQL and increments the user's global `user_session_version` in Redis.
   - All active access tokens across all devices become invalid within the 15-minute token lifetime.

---

## 4. Account Collision & Federated Linking

### 4.1 Collision Prevention

- When a user signs in via OAuth with an email that matches an existing password-based account, the system **never automatically links** the accounts.
- The API returns `409 ACCOUNT_COLLISION` with an opaque, short-lived collision transaction token.
- The UI directs the user to enter their password to verify ownership before binding the OAuth provider.
- If the existing account has no password (e.g. created with another OAuth provider), ownership must be verified via the original provider or an email recovery challenge.

### 4.2 Account Unlinking

- A user may unlink an OAuth provider only if at least one other valid authentication mechanism (a password or another linked OAuth provider) remains active on the account.

---

## 5. Password Reset & Recovery

- Users may request a password reset by submitting their email address.
- The API response is enumeration-resistant: identical `200 OK` generic acknowledgment is returned whether the email exists or not.
- Reset tokens are 256-bit secure random strings, stored as SHA-256 hashes in `auth_tokens`, with a 15-minute expiration.
- Redeeming a password reset token consumes the token, updates the password hash, and immediately revokes all active sessions for that user.
