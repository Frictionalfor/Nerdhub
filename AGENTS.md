# NerdHub — instructions for coding agents

This file is the canonical instruction source for Kilo, Antigravity, Codex and other repository agents. Read it before changing files.

## 1. Mission and source of truth

Build NerdHub according to `README.md` and the documentation under `docs/`. If a requirement is unclear or documents conflict, stop and report the conflict; do not silently invent product behavior.

The project is currently at the documentation/bootstrap stage. Do not claim a feature, migration, endpoint, test or build exists unless you verify it in the working tree.

## 2. Mandatory start-of-task procedure

Before editing:

1. Read this file and the relevant documentation.
2. Run `git status --short --branch`.
3. Inspect the current repository structure and relevant source files.
4. Identify the exact task, acceptance criteria, dependencies and files likely to change.
5. Write a short implementation plan.
6. Check for existing implementations before creating new abstractions.
7. If the task changes an API, schema, architecture, security boundary or product behavior, identify which docs and ADRs must also change.

Do not overwrite uncommitted user work. Never run destructive cleanup commands without explicit approval.

## 3. Task boundaries and multi-agent coordination

- One agent owns a task and its working files at a time.
- Do not have Kilo, Agy, Codex and Copilot independently implement the same feature in parallel.
- Copilot is primarily an inline completion/chat assistant; the human developer remains the task owner.
- Use Codex for architecture reasoning, planning, code review and bounded implementation when explicitly assigned.
- Use Kilo or Agy as the primary implementer for a clearly scoped task; do not run both against the same files concurrently.
- A reviewer agent must not modify the implementation unless asked. It should return findings with file/line references and severity.
- Record task ownership in the issue/PR description when multiple tools are involved.
- Never paste secrets, private user data, production credentials or private keys into any AI tool.

## 4. Architecture constraints

- Desktop: Tauri 2 + React + TypeScript + Vite.
- Backend: NestJS modular monolith with separately runnable API and worker processes.
- Database: PostgreSQL with Prisma migrations.
- Jobs/cache: Redis + BullMQ.
- Storage: S3-compatible object storage behind a storage abstraction.
- API: versioned REST under `/api/v1`, documented with OpenAPI 3.1.
- Monorepo: pnpm workspaces + Turborepo.
- Keep the API independent from the desktop UI so a web client can be added later.
- Do not introduce microservices, Kubernetes, Kafka, GraphQL or another database without an accepted ADR.
- Keep shared contracts, validation and API client code in shared packages; avoid circular dependencies.

## 5. Security and trust boundaries

- The backend is authoritative for authentication, authorization, ownership, moderation, XP, reputation, wallet balances and cosmetic ownership.
- Never trust role, price, XP, currency, permissions, ownership or moderation state supplied by the client.
- Never add a public endpoint that accepts arbitrary XP or NerdCoins.
- Ledger changes must be transactional, idempotent and auditable. Correct mistakes with compensating entries; do not rewrite history.
- Validate all input at API boundaries.
- Treat Markdown, uploaded files, URLs, external links and user-generated content as untrusted.
- Do not execute user-submitted code in the API or worker.
- Keep secrets server-side and out of logs, screenshots, commits and client bundles.
- Use least-privilege Tauri capabilities. Do not enable broad filesystem or shell access without a documented need and review.
- Authentication flows must use secure OAuth/OIDC practices, including state, PKCE and nonce where applicable.
- Apply authorization checks on every protected server-side operation.
- Add rate limits and abuse controls to authentication, uploads, search and contribution endpoints.

## 6. Engineering standards

- TypeScript strict mode; avoid `any`. If unavoidable, explain why and isolate it.
- Prefer small, cohesive modules and explicit types.
- Controllers/route handlers stay thin; business rules live in domain/application services.
- Use database transactions for multi-record invariants.
- Use UTC timestamps and explicit timezone conversion at UI boundaries.
- Use migrations for schema changes; never mutate production schema manually.
- Keep errors typed and responses consistent.
- Do not swallow errors or add empty catch blocks.
- Do not disable lint rules, TypeScript checks or tests just to make a task pass.
- No placeholder buttons or fake success states.
- UI must include loading, empty, error and offline states where relevant.
- Support keyboard navigation, visible focus, semantic controls, readable contrast and reduced motion.
- Keep dependencies minimal and justify new runtime dependencies.

## 7. Required tests

For each feature, add appropriate tests:

- Unit tests for domain rules and validation.
- Integration tests for database, API and queue boundaries.
- Authorization tests for protected operations.
- Regression tests for bug fixes.
- UI/component tests for meaningful interaction states.
- End-to-end tests for critical user journeys.

Never claim tests passed unless you ran them and captured the result.

## 8. Documentation obligations

Update documentation when changing:

- architecture or dependency direction → architecture docs and ADR,
- database schema → data model and migration notes,
- endpoints/contracts → OpenAPI and API docs,
- environment variables → `.env.example` and setup docs,
- security/privacy behavior → security and threat model,
- user-visible behavior → product requirements and release notes,
- operational behavior → deployment/runbooks.

Do not create fake generated documentation. Mark generated artifacts as generated and provide the command that regenerates them.

## 9. Git and change hygiene

- Use focused changes and conventional commit messages.
- Do not rewrite shared history or force-push unless explicitly approved.
- Do not delete files or restructure large areas outside task scope.
- Inspect `git diff --check`, `git diff --stat` and the full diff before completion.
- Do not commit unless asked.
- Never commit `.env`, credentials, tokens, certificates or local databases.

## AI contributor attribution

- The human repository owner remains the primary author and committer.
- Add a `Co-authored-by` trailer for an AI agent only when that agent made a material contribution included in the commit, such as substantive code, tests, documentation or architecture work.
- Read-only reviews, ordinary autocomplete and inline suggestions alone do not qualify for co-author attribution.
- Attribute only the specific agents that materially contributed; never add every agent by default.
- Before recommending a trailer, verify the agent's GitHub identity and an email address associated with that account. Never infer or invent a username, identity or email.
- If an agent identity or associated email cannot be verified, omit the trailer. When useful, document the agent's contribution in the pull request or issue instead.
- Keep the human repository owner as author and committer; agent attribution does not replace either identity.
- Do not retroactively rewrite historical commits to add AI attribution.

## 10. Definition of done

A task is complete only when:

1. Acceptance criteria are met.
2. Relevant tests were added/updated and run.
3. Formatting, lint, typecheck and build checks relevant to the task pass.
4. Security and authorization implications were considered.
5. Documentation and ADRs are updated where needed.
6. The final diff is reviewed and contains no unrelated changes.
7. Any unrun checks or known limitations are stated honestly.

## 11. Required completion report

Return:

### Summary

What changed and why.

### Files changed

List important files.

### Validation

Exact commands run and pass/fail results. Say “not run” where applicable.

### Security / data impact

Permissions, secrets, migrations, user data and trust-boundary impact.

### Documentation

Docs and ADRs updated.

### Remaining work

Known limitations, follow-up tasks and anything requiring human decision.
