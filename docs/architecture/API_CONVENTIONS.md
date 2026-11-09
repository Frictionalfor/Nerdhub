# API Conventions

## Baseline

- REST API under `/api/v1`.
- OpenAPI 3.1 is the contract source.
- JSON request/response bodies.
- TLS in deployed environments.
- Cursor pagination for potentially large collections.
- Validate all inputs at the API boundary.
- Enforce authorization in the backend, not the desktop client.

## Route families

| Area          | Example routes                                                     |
| ------------- | ------------------------------------------------------------------ |
| Auth          | `/api/v1/auth/register`, `/login`, `/logout`, `/oauth/:provider/*` |
| Current user  | `/api/v1/me`, `/api/v1/me/sessions`, `/api/v1/me/export`           |
| Profiles      | `/api/v1/users/:handle`                                            |
| Topics        | `/api/v1/topics`, `/api/v1/topics/:slug/follow`                    |
| Feed/search   | `/api/v1/feed`, `/api/v1/search`                                   |
| Posts         | `/api/v1/posts`, `/api/v1/posts/:id`                               |
| Comments      | `/api/v1/posts/:id/comments`                                       |
| Articles      | `/api/v1/articles`, `/api/v1/articles/:slug`                       |
| Ideas         | `/api/v1/ideas`, `/api/v1/ideas/:id/updates`                       |
| Progression   | `/api/v1/leaderboards`, `/api/v1/me/progress`                      |
| Cosmetics     | `/api/v1/cosmetics`, `/api/v1/me/cosmetics`                        |
| Assets        | `/api/v1/assets/upload-intents`, `/api/v1/assets/:id`              |
| Notifications | `/api/v1/me/notifications`                                         |
| Moderation    | `/api/v1/reports`, restricted `/api/v1/admin/*`                    |

These are route families, not a complete generated API contract. Define exact methods, schemas, status codes and authorization before implementing each route.

## Response shape

All successful API responses use a consistent envelope:

```json
{
  "data": {},
  "meta": {
    "requestId": "request-id"
  }
}
```

- `data` holds the resource payload (may be an object, array, or `null` for
  no-content mutations).
- `meta.requestId` is a unique identifier for the request, useful for
  correlating client reports with server logs.

### Request ID

Every response carries the request ID in the `X-Request-Id` response header.

The server determines the request ID in this order:

1. The `x-request-id` request header (configurable via `REQUEST_ID_HEADER`).
2. The `x-amzn-requestid` request header.
3. A freshly generated `crypto.randomUUID()` value.

Clients SHOULD send `x-request-id` for idempotency and debugging; the server
echoes it back in both the header and `meta.requestId`. Error responses also
include `requestId` inside the `error` object and set the header.

Responses that already carry the envelope shape (`{ data, meta }`) are passed
through unchanged to avoid double-wrapping.

Error responses are machine-readable and safe:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": [],
    "requestId": "request-id"
  }
}
```

Do not return stack traces, SQL, secrets or internal provider responses.

### Health and readiness

`GET /api/v1/health` and `GET /api/v1/readiness` are versioned API responses
and are wrapped in the same envelope. Their semantics are preserved inside
`data` (e.g. `data.status` is `'ok'` or `'degraded'`); they are not exempt from
the envelope.

## Pagination

Use opaque cursors. Return `items` and `nextCursor`; do not rely on offset pagination for rapidly changing feeds. Define stable sort keys and tie-breakers.

## Idempotency

Use idempotency keys for operations where retries could create duplicate side effects, especially ledger awards, uploads/finalization and job-triggering mutations. The server must scope keys to the authenticated actor and operation.

## Authentication and authorization

- Use secure session cookies or a documented desktop token/session strategy.
- Protect state-changing routes against CSRF where cookie auth is used.
- Check ownership and role permissions on every protected route.
- Never accept a client-supplied role or permission claim as authoritative.
- OAuth callbacks validate state, PKCE and nonce as applicable.

## OpenAPI workflow

For each implemented route:

1. Define request/response schemas.
2. Define auth requirements and error responses.
3. Add examples and pagination semantics.
4. Generate or validate OpenAPI from the implementation.
5. Add contract/integration tests.
6. Keep the generated artifact and generation command clearly identified.
