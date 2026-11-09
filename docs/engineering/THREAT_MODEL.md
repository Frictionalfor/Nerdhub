# Threat Model

## Assets

- Account credentials and sessions.
- Email addresses and private profile settings.
- User posts, drafts, messages (if introduced) and uploaded files.
- OAuth credentials/tokens.
- XP and NerdCoin ledgers.
- Moderation reports and audit logs.
- Production infrastructure secrets and backups.

## Trust boundaries

1. Desktop renderer ↔ Tauri native layer.
2. Desktop app ↔ public API.
3. API ↔ PostgreSQL/Redis/object storage.
4. API ↔ OAuth/email providers.
5. API ↔ background worker.
6. User-generated content ↔ other users' browsers/renderers.
7. Maintainer/admin tools ↔ user data and moderation systems.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| Account takeover | Secure password hashing, rate limits, verification, recovery controls, session revocation, MFA later |
| OAuth account confusion | State, PKCE, nonce, strict callback validation, explicit account linking |
| Broken object authorization | Server-side ownership checks and negative authorization tests |
| XP/currency fraud | Server-only policy, append-only ledger, transactions, idempotency |
| Stored XSS | Safe Markdown renderer, sanitization, restrictive link handling and CSP where applicable |
| Malicious uploads | Size/type checks, generated object keys, private storage, scanning strategy |
| SSRF via user URLs | Avoid server-side fetching by default; strict allowlists and egress controls if fetching is added |
| Spam and abuse | Rate limits, reports, blocks, moderation workflow and anti-automation controls |
| Secret leakage | Secret manager/environment injection, redaction, scanning, no secrets in renderer |
| Compromised desktop capability | Least-privilege Tauri permissions and narrow IPC commands |
| Queue replay | Idempotent job handlers and unique operation identifiers |
| Admin misuse | Least privilege, audit logs, separation of duties and review |

## Security review triggers

Require focused review for auth/session changes, OAuth, file uploads, Markdown rendering, admin routes, role changes, ledger operations, account export/deletion and any feature that handles private messages or sensitive personal data.

## Open questions

- Exact session strategy for desktop and API.
- Password hashing parameters and secret management provider.
- Malware scanning and upload quarantine approach.
- Data retention and deletion/anonymization policy.
- Privacy/legal review for the operating jurisdictions.
