# Environment Configuration

This is a planning document. Add variables to `.env.example` only when their consuming code exists. Never commit real values.

## Planned server-side variable groups

| Group | Examples (names are provisional) | Notes |
|---|---|---|
| Runtime | `NODE_ENV`, `PORT`, `LOG_LEVEL` | Validate at startup |
| Database | `DATABASE_URL` | Server only |
| Redis | `REDIS_URL` | Server/worker only |
| Session/auth | `SESSION_SECRET`, token signing configuration | Use strong secret material |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Server-side secrets never enter desktop bundle |
| Email | `EMAIL_PROVIDER`, provider credentials, sender address | Use sandbox in development |
| Object storage | endpoint, bucket, region, access credentials | Private bucket by default |
| App URLs | API base URL, callback allowlist | Validate allowed origins/callbacks |

## Rules

- Treat these names as provisional until implemented.
- Parse and validate environment variables at startup.
- Fail fast on missing required production configuration.
- Do not log secret values.
- Keep separate values per environment.
- Provide safe dummy examples only.
