# Desktop OAuth Architecture Specification

> **Document Status:** PROPOSED
> **Milestone:** M1 — Identity and Onboarding
> **Module:** Desktop & OAuth
> **Last Updated:** 2026-11-09

---

## 1. Overview & Protocol Selection (Finding M1-HIGH-01)

Milestone M1 establishes secure federated authentication (GitHub OAuth 2.0 and Google OpenID Connect) for the Tauri 2 desktop application.

### Protocol Comparison & Decision

| Transport Mechanism                                                          | Cross-Platform Compatibility                                                                                   | Security Evaluation                                                                                                                                                                 | Decision                                                  |
| :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Claimed HTTPS Links** (App Links / Universal Links)                        | Windows and macOS only. **Unsupported on Linux desktop** (no standard OS link claiming daemon across distros). | Very High (domain-verified ownership).                                                                                                                                              | **Rejected for M1** (violates Linux desktop requirement). |
| **Loopback Redirect** (`http://127.0.0.1:PORT`)                              | Windows, macOS, Linux.                                                                                         | High, but triggers OS firewall prompts on Windows, encounters Chrome Private Network Access (PNA) navigation blocks, and requires embedding a local HTTP server in the desktop app. | **Rejected as primary.**                                  |
| **Custom URI Scheme** (`nerdhub://auth/callback`) + **PKCE Completion Code** | **Universal:** Natively supported across Linux (X11/Wayland), macOS, and Windows.                              | **Very High when paired with PKCE:** Even if a malicious local app hijacks the URI scheme, it cannot exchange the completion code without the memory-bound PKCE verifier.           | **RECOMMENDED PRIMARY**                                   |

---

## 2. End-to-End Authentication Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant App as Tauri Desktop (React)
    participant Core as Tauri Core (Rust)
    participant Browser as External System Browser
    participant Provider as OAuth Provider (GitHub/Google)
    participant API as NestJS API

    User->>App: Clicks "Sign in with GitHub"
    App->>Core: Generate PKCE (verifier V, challenge C = SHA256(V))
    App->>Core: Generate cryptographically random `state` and `nonce`
    App->>App: Retain V, state, nonce in memory
    App->>Core: Open system browser at API auth initiation URL
    Core->>Browser: Launches https://api.nerdhub.com/api/v1/auth/oauth/github?challenge=C&state=...
    Browser->>API: GET initiation route
    API->>API: Records pending transaction (TTL: 5m)
    API-->>Browser: 302 Redirect to Provider authorization page
    Browser->>Provider: User authenticates & grants consent
    Provider-->>Browser: 302 Redirect to https://api.nerdhub.com/api/v1/auth/oauth/github/callback?code=AUTH_CODE&state=...
    Browser->>API: Exchanges AUTH_CODE with Provider for identity/tokens
    API->>API: Validates provider identity & asserts non-collision
    API->>API: Generates short-lived (60s) single-use `completion_code`
    API-->>Browser: 302 Redirect to nerdhub://auth/callback?completion_code=COMP_CODE&state=...
    Browser->>Core: OS invokes URI handler: nerdhub://auth/callback
    Core->>App: Deep-link event delivered to desktop UI
    App->>App: Asserts `state` matches memory value
    App->>API: POST /api/v1/auth/oauth/complete { completion_code: COMP_CODE, code_verifier: V }
    API->>API: Verify SHA256(V) == C; consume completion_code (single-use)
    API-->>App: HTTP 200 OK with session tokens (JWT + Refresh Token)
    App->>Core: Securely persist Refresh Token; keep Access Token in RAM
```

---

## 3. Defense Against Deep-Link Interception

On desktop operating systems, custom URI schemes (such as `nerdhub://`) are registered globally in the operating system. In theory, a malicious application installed on the same machine could register the same scheme.

NerdHub neutralizes this threat through **Cryptographic PKCE Completion Binding**:

1. The external browser only receives a short-lived `completion_code` (expiring in 60 seconds).
2. The `completion_code` cannot be used on its own to authenticate.
3. The API endpoint `POST /api/v1/auth/oauth/complete` requires **both** the `completion_code` and the unhashed PKCE `code_verifier` ($V$).
4. Because the `code_verifier` was generated inside the legitimate desktop application's memory and was never transmitted via URLs, browser history, or URI schemes, an intercepting application possesses only the useless `completion_code`.
5. Upon the first redemption attempt (whether successful or failing verification), the `completion_code` is permanently purged. Replay attacks are impossible.

---

## 4. Multi-Platform OS URI Scheme Registration

The `nerdhub://` scheme is registered natively via the official Tauri deep-link plugin across all target platforms:

### 4.1 Linux Desktop (X11 & Wayland)

Registered via the standard freedesktop.org `.desktop` entry and MIME type association:

```ini
[Desktop Entry]
Name=NerdHub
Exec=nerdhub %u
Type=Application
Terminal=false
MimeType=x-scheme-handler/nerdhub;
```

Activated during system installation via:

```bash
xdg-mime default nerdhub.desktop x-scheme-handler/nerdhub
```

### 4.2 macOS

Registered within the application bundle `Info.plist` via `CFBundleURLTypes`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.nerdhub.desktop</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>nerdhub</string>
    </array>
  </dict>
</array>
```

### 4.3 Windows

Registered in the Windows Registry under `HKEY_CURRENT_USER\Software\Classes\nerdhub`:

```
[HKEY_CURRENT_USER\Software\Classes\nerdhub]
@="URL:NerdHub Protocol"
"URL Protocol"=""

[HKEY_CURRENT_USER\Software\Classes\nerdhub\shell\open\command]
@="\"C:\\Program Files\\NerdHub\\nerdhub.exe\" \"%1\""
```

---

## 5. Token Isolation & Storage in Desktop Renderer

- **Access Token:** Held strictly in JavaScript heap memory inside the React state holder. Never written to `localStorage`, `sessionStorage`, or `IndexedDB`.
- **Refresh Token:** Transferred via Tauri IPC command to the Rust backend, which persists it into the host operating system's native secure credential storage (Linux Secret Service / Keyring, macOS Keychain, Windows Credential Manager).
- **IPC Hardening:** The Tauri IPC bridge exposes strictly typed, isolated invoke handlers (`save_token`, `read_token`, `clear_token`) with no access to raw filesystem or shell execution APIs.
