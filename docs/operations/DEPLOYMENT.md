# Deployment and Operations

## Environments

Maintain separate local, staging and production environments. Never point local development at production databases or buckets.

## Local development

Use Docker Compose for PostgreSQL and Redis during M0. The desktop app, API and worker should run locally with documented commands. Use fake/test email and OAuth adapters locally unless a developer intentionally configures sandbox credentials.

## Hosted baseline

- Desktop installers distributed through trusted release channels.
- API behind TLS termination and a reverse proxy/load balancer.
- Worker deployed separately from API.
- Managed PostgreSQL with automated backups and point-in-time recovery where available.
- Redis with persistence/availability appropriate to queue semantics.
- Private S3-compatible object storage.
- Secrets injected through environment/secret manager, never committed.
- Centralized logs, metrics and error reporting with sensitive-data redaction.

## Self-hosting

Provide a supported Docker Compose deployment only after the hosted deployment model and operational requirements stabilize. Document supported versions, backup, restore, upgrades, storage configuration, email provider and OAuth callback setup.

## Operational checks

- Liveness and readiness endpoints.
- Database connectivity and migration status.
- Queue depth and failed-job monitoring.
- Storage availability and upload failures.
- API latency/error rates.
- Worker retry/failure rates.
- Auth abuse and rate-limit signals.
- Moderation backlog.

## Backups and recovery

- Back up PostgreSQL and object storage metadata/content.
- Define retention and encryption.
- Test restore into an isolated environment.
- Document recovery point and recovery time objectives before public launch.
- Never claim backups are valid without restore testing.

## Incident response

1. Triage impact and scope.
2. Contain active abuse or compromise.
3. Preserve relevant logs without exposing private user data.
4. Rotate compromised credentials.
5. Restore service safely.
6. Notify affected users/regulators when required by applicable law.
7. Record root cause and follow-up actions.
