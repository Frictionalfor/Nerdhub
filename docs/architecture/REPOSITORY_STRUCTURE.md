# Proposed Repository Structure

This is the target shape. Create directories incrementally during M0; do not generate empty modules for every future feature.

```text
nerdhub/
├── apps/
│   ├── desktop/                 # Tauri + React renderer
│   ├── api/                     # NestJS HTTP API
│   └── worker/                  # BullMQ worker process
├── packages/
│   ├── contracts/               # Shared DTO/schema contracts
│   ├── api-client/              # Typed API client
│   ├── config/                  # Shared lint/tsconfig/prettier config
│   └── ui/                      # Shared UI primitives (when justified)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 0001_init/
├── docker-compose.yml           # Local PostgreSQL + Redis
├── .env.example
├── docs/
├── scripts/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .agent/
├── .kilocode/
├── AGENTS.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

## Dependency direction

- Desktop may depend on `packages/contracts` and `packages/api-client`.
- API owns domain rules and database writes.
- Worker invokes application/domain services or dedicated job handlers; it must not duplicate business rules.
- Shared packages must not import from apps.
- Avoid importing Prisma-generated types into the desktop renderer.
- Do not expose server-only secrets or implementation details in shared client packages.

## Feature organization

Organize by feature/domain, not by a huge global collection of generic files. Keep controllers, DTOs, services, repositories and tests close to their module where that improves discoverability.
