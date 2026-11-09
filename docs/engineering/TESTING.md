# Testing Strategy

## Testing pyramid

### Unit tests

Test domain rules, validation, pure functions and state transitions. Examples:

- XP award policy and caps.
- Topic hierarchy validation.
- Handle normalization.
- Permission decisions.
- Cursor encoding/decoding.

### Integration tests

Test database constraints, transactions, repositories, API modules, storage adapters and queue handlers against controlled dependencies.

### Contract tests

Validate API request/response schemas against OpenAPI. Detect accidental breaking changes.

### End-to-end tests

Cover critical journeys:

- Register/sign in and complete onboarding.
- Follow a topic and create a post.
- Comment/react/bookmark.
- Publish and edit an article.
- Report content.
- View progress and equip an owned cosmetic.

### Desktop tests

Test deep links, offline/error behavior, window lifecycle, secure storage boundaries and packaged builds on supported operating systems.

## Security-focused tests

- User A cannot read or mutate User B's private data.
- A non-moderator cannot perform moderator actions.
- Client cannot assign roles or grant XP/currency.
- Replayed idempotency key does not duplicate side effects.
- Expired/reused auth tokens are rejected.
- Unsafe HTML/Markdown payloads do not execute.
- Upload MIME/type/size/ownership checks are enforced.
- OAuth state/PKCE validation rejects tampering.

## Test data

Use synthetic accounts and fixtures. Never use production user data in tests. Avoid tests that depend on external live OAuth providers or email delivery; use provider adapters/mocks.

## Reliability

Test retry behavior, duplicate job delivery, worker shutdown and database transaction failure. A background job should be safe to retry.

## Reporting

Record exact commands and results in PRs. Do not mark skipped tests as passed.
