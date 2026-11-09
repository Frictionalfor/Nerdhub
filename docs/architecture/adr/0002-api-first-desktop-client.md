# ADR 0002: Keep the desktop client separate from backend authority

**Status:** Accepted baseline

## Context

NerdHub starts desktop-first but may add web and mobile clients. Business rules and user data must not be coupled to a particular renderer.

## Decision

Expose a versioned REST API with an OpenAPI contract. The desktop app is an API client. The backend is authoritative for authentication, authorization, content ownership, moderation, XP and currency.

## Consequences

- Future clients can reuse the same API.
- Network and offline states must be handled in the desktop app.
- Client-side state is never trusted for security-sensitive decisions.
