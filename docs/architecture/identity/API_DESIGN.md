# API Design Specification (Milestone M1)

> **Document Status:** PROPOSED — NOT IMPLEMENTED
> **Milestone:** M1 — Identity and Onboarding
> **Base Path:** `/api/v1`
> **Specification Standard:** REST / OpenAPI 3.1
> **Last Updated:** 2026-11-09
> **Notice:** The endpoints below are proposed API contracts. None of these endpoints are currently implemented in application code.

---

## 1. Response Envelope & Header Conventions

All endpoints strictly adhere to the [API Conventions](../API_CONVENTIONS.md) and the standard response envelope verified under MED-03.

### Successful Response Format

```json
{
  "data": { ... },
  "meta": {
    "requestId": "c1f7a6b2-8419-4b53-85e6-23992b8d9904"
  }
}
```

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "requestId": "c1f7a6b2-8419-4b53-85e6-23992b8d9904"
  }
}
```

Every response echoes the unique request identifier in the `X-Request-Id` HTTP header.

### Standard Authentication & Session Error Codes

| Error Code                       | HTTP Status | Meaning                                                                  | Client Action                                                       |
| :------------------------------- | :---------: | :----------------------------------------------------------------------- | :------------------------------------------------------------------ |
| `INVALID_CREDENTIALS`            |     401     | Email or password incorrect                                              | Prompt user to retry or reset password                              |
| `SESSION_REVOKED`                |     401     | Session has been terminated (logout or remote revocation)                | Clear stored credentials; redirect to login                         |
| `SESSION_EVICTED`                |     401     | Session was evicted because account reached 5-device maximum             | Display eviction notice: _"Signed out: maximum 5 devices reached."_ |
| `TOKEN_REUSE_DETECTED`           |     401     | Consumed refresh token replayed; entire session family revoked           | Force full re-authentication; display security alert                |
| `SESSION_VALIDATION_UNAVAILABLE` |     503     | Redis is unavailable during a write or sensitive operation (fail-closed) | Inform user service is temporarily degraded; retry when operational |
| `ACCOUNT_COLLISION`              |     409     | OAuth email matches existing unlinked account                            | Prompt user to enter password to verify and link account            |
| `RATE_LIMIT_EXCEEDED`            |     429     | Velocity limits exceeded on route                                        | Display cooldown timer before retry                                 |

---

## 2. Authentication & Credential Endpoints

### 2.1 `POST /api/v1/auth/register`

Creates a new account using email and password.

- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "CorrectHorseBatteryStaple123!",
    "handle": "curious_coder"
  }
  ```
- **Validation:**
  - `email`: valid RFC 5322 format, max 255 chars.
  - `password`: min 12 chars, max 128 chars.
  - `handle`: `^[a-z0-9_]{3,30}$`.
- **Response (HTTP 201 Created):**
  ```json
  {
    "data": {
      "user": {
        "id": "a9e6a048-2fa5-455a-bd5b-b9fbe4a872aa",
        "email": "user@example.com",
        "emailVerified": false
      },
      "status": "PENDING_VERIFICATION"
    },
    "meta": { "requestId": "..." }
  }
  ```

### 2.2 `POST /api/v1/auth/login`

Authenticates user credentials and issues session tokens.

- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "CorrectHorseBatteryStaple123!"
  }
  ```
- **Response (HTTP 200 OK):**
  - **Set-Cookie Header:** `refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=2592000`
  - **Body:**
    ```json
    {
      "data": {
        "accessToken": "eyJhbGciOi...",
        "tokenType": "Bearer",
        "expiresIn": 900,
        "user": {
          "id": "a9e6a048-2fa5-455a-bd5b-b9fbe4a872aa",
          "email": "user@example.com",
          "emailVerified": false
        }
      },
      "meta": { "requestId": "..." }
    }
    ```
- **Error Codes:** `INVALID_CREDENTIALS` (401), `ACCOUNT_LOCKED` (423), `TOO_MANY_REQUESTS` (429).

### 2.3 `POST /api/v1/auth/refresh`

Rotates the session refresh token and issues a fresh 15-minute access token.

- **Headers:** `Idempotency-Key` (UUID) recommended.
- **Cookie:** `refresh_token` (active refresh token).
- **Response (HTTP 200 OK):**
  - **Set-Cookie Header:** Updated `refresh_token` cookie.
  - **Body:**
    ```json
    {
      "data": {
        "accessToken": "eyJhbGciOi...",
        "tokenType": "Bearer",
        "expiresIn": 900
      },
      "meta": { "requestId": "..." }
    }
    ```
- **Error Codes:** `TOKEN_REVOKED` (401), `TOKEN_REUSE_DETECTED` (401).

### 2.4 `POST /api/v1/auth/logout`

Terminates the current active session.

- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (HTTP 200 OK):**
  - Clears `refresh_token` cookie.
  - Body: `{ "data": { "success": true }, "meta": { "requestId": "..." } }`

---

## 3. Email Verification & Password Recovery Endpoints

### 3.1 `POST /api/v1/auth/email-verification/request`

Requests a fresh verification email.

- **Request Body:** `{ "email": "user@example.com" }`
- **Rate Limit:** Max 3 per hour per email, max 10 per hour per IP.
- **Response (HTTP 200 OK):**
  - Enumeration-resistant generic message:
    ```json
    {
      "data": {
        "message": "If an unverified account exists for this address, a verification link has been sent."
      },
      "meta": { "requestId": "..." }
    }
    ```

### 3.2 `POST /api/v1/auth/email-verification/confirm`

Redeems an email verification token.

- **Request Body:** `{ "token": "..." }`
- **Response (HTTP 200 OK):**
  ```json
  {
    "data": { "verified": true },
    "meta": { "requestId": "..." }
  }
  ```

### 3.3 `POST /api/v1/auth/password-reset/request`

Initiates a password reset challenge.

- **Request Body:** `{ "email": "user@example.com" }`
- **Response (HTTP 200 OK):** Generic acknowledgment.

### 3.4 `POST /api/v1/auth/password-reset/confirm`

Redeems a reset token and sets a new password.

- **Request Body:**
  ```json
  {
    "token": "...",
    "newPassword": "NewCorrectHorseBatteryStaple123!"
  }
  ```
- **Response (HTTP 200 OK):**
  - All existing user sessions are revoked.
  - Returns confirmation message.

---

## 4. Desktop OAuth Endpoints

### 4.1 `GET /api/v1/auth/oauth/:provider`

Initiates external browser OAuth flow.

- **Path Params:** `provider` = `github` | `google`.
- **Query Params:** `code_challenge` (S256), `state`.
- **Response (HTTP 302 Redirect):** Redirects browser to external provider consent URL.

### 4.2 `GET /api/v1/auth/oauth/:provider/callback`

Internal callback receiving provider authorization code.

- **Response (HTTP 302 Redirect):** Redirects browser to `nerdhub://auth/callback?completion_code=...&state=...`.

### 4.3 `POST /api/v1/auth/oauth/complete`

Desktop client exchanges completion code and PKCE verifier for session tokens.

- **Request Body:**
  ```json
  {
    "completionCode": "comp_987234982734",
    "codeVerifier": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
  }
  ```
- **Response (HTTP 200 OK):** Issues access token and sets refresh token cookie.
- **Error Codes:** `409 ACCOUNT_COLLISION` (if unlinked account with matching email exists).

---

## 5. User Profile & Onboarding Endpoints

### 5.1 `GET /api/v1/me`

Fetches authenticated user identity, profile, and onboarding state.

- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (HTTP 200 OK):**
  ```json
  {
    "data": {
      "user": {
        "id": "a9e6a048-2fa5-455a-bd5b-b9fbe4a872aa",
        "email": "user@example.com",
        "emailVerified": true
      },
      "profile": {
        "handle": "curious_coder",
        "displayName": "Curious Coder",
        "bio": null,
        "avatarUrl": null
      },
      "onboarding": {
        "currentStep": "INTERESTS",
        "completed": false
      }
    },
    "meta": { "requestId": "..." }
  }
  ```

### 5.2 `PATCH /api/v1/me/profile`

Updates handle and public profile attributes during onboarding or settings.

- **Request Body:**
  ```json
  {
    "displayName": "Ada Lovelace",
    "bio": "Enthusiast of analytical engines."
  }
  ```

### 5.3 `POST /api/v1/me/onboarding/interests`

Records topic selections and marks onboarding complete.

- **Request Body:**
  ```json
  {
    "interestIds": [
      "228a8d11-58e1-45ec-9f5e-14187e14a274",
      "87d1ea21-81d3-4925-9ef3-b452e9a26be4",
      "99c8f001-92ab-4176-a05e-f001e920c812"
    ],
    "skipped": false
  }
  ```
- **Response (HTTP 200 OK):** Returns updated onboarding status.
