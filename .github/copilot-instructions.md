# GitHub Copilot instructions for NerdHub

Follow the canonical repository rules in `/AGENTS.md` and the relevant documentation under `/docs`.

## Core rules

- Respect accepted ADRs and the modular-monolith architecture.
- Keep business rules and security decisions on the server.
- Never trust client-supplied roles, permissions, ownership, XP or currency.
- Never add arbitrary XP/NerdCoin grant endpoints.
- Use Prisma migrations for schema changes.
- Validate input at API boundaries.
- Keep controllers thin; domain/application services own business rules.
- Add tests for new behavior and regression tests for bug fixes.
- Update docs and OpenAPI when contracts or behavior change.
- Do not introduce microservices, Kubernetes or new infrastructure without an ADR.
- Do not invent APIs, scripts, environment variables or existing features; inspect the repository.
- Do not disable lint/type/test rules to silence failures.
- Never include secrets, real user data or credentials in generated code.
- Prefer small, focused, typed changes and accessible UI.
- Do not commit or rewrite history.

Before suggesting a substantial change, inspect surrounding code and preserve established patterns. Human review is mandatory for authentication, authorization, migrations, moderation, file uploads and ledger logic.
