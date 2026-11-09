# Security Policy

## Reporting a vulnerability

Do not disclose exploitable vulnerabilities in public issues or discussions.

Until a dedicated private security contact is published, use the repository host's private vulnerability reporting feature if enabled. If it is not enabled, contact the maintainers through a verified private channel listed in the repository profile. Do not include secrets or real user data in a report.

Please include:

- Affected component and version/commit.
- Impact and realistic attack scenario.
- Reproduction steps or proof of concept.
- Any suggested mitigation.
- Whether the issue is known to be actively exploited.

## Response expectations

The maintainers should acknowledge a valid report, assess severity, coordinate a fix and agree on disclosure timing with the reporter. Do not promise a response SLA until maintainers can reliably meet it.

## Security priorities

- Authentication, account recovery and OAuth/OIDC.
- Authorization and object-level access control.
- User-generated content and Markdown rendering.
- Upload validation, storage and download authorization.
- XP and NerdCoin ledger integrity.
- Moderation, reporting and privacy.
- Desktop application capabilities and deep-link handling.
- Dependency and build pipeline integrity.

## Supported versions

Support policy is not yet established. Until a formal policy exists, assume only the latest maintained development branch receives security fixes.

## Secret handling

Never commit credentials, tokens, private keys, production data or real `.env` files. Use `.env.example` with dummy values only. Rotate any secret that may have been exposed.
