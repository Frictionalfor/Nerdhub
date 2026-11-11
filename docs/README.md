# NerdHub Documentation Index

> **Master Navigation & Architecture Index**<br/>
> **Current Status:** Milestone M0 APPROVED; Milestone M1 REMEDIATED (Implementation BLOCKED pending owner approval).

Welcome to the NerdHub documentation package. This repository maintains a strict documentation-first discipline. Before modifying code, read this guide and the referenced specifications.

---

## 1. Quick Start & Reading Order

For developers and autonomous coding agents (`Kilo`, `Antigravity`, `Codex`):

1. **Instructions for Agents:** [AGENTS.md](../AGENTS.md) — Canonical instructions and trust boundaries.
2. **Current Project Status:** [PROJECT_STATUS.md](engineering/PROJECT_STATUS.md) — Verified milestone status and blockers.
3. **Product Vision & Scope:** [MVP.md](product/MVP.md) and [PRODUCT_REQUIREMENTS.md](product/PRODUCT_REQUIREMENTS.md).
4. **Architecture Baseline:** [ARCHITECTURE.md](architecture/ARCHITECTURE.md) and [REPOSITORY_STRUCTURE.md](architecture/REPOSITORY_STRUCTURE.md).
5. **Milestone Roadmap:** [ROADMAP.md](ROADMAP.md).
6. **Agent Collaboration:** [AI_AGENT_WORKFLOW.md](engineering/AI_AGENT_WORKFLOW.md).

---

## 2. Product Documentation (`docs/product/`)

| Document                                                                  | Purpose                                                           |           Status           |
| :------------------------------------------------------------------------ | :---------------------------------------------------------------- | :------------------------: |
| [MVP.md](product/MVP.md)                                                  | Minimum Viable Product definition and milestone boundaries        |        **APPROVED**        |
| [PRODUCT_REQUIREMENTS.md](product/PRODUCT_REQUIREMENTS.md)                | Comprehensive functional and user journey requirements            |        **APPROVED**        |
| **Identity & Onboarding Subsystem:**                                      |                                                                   |                            |
| [PRODUCT_DECISIONS.md](product/identity/PRODUCT_DECISIONS.md)             | Canonical decision register (M1-P-01 through M1-P-04)             | **PENDING OWNER APPROVAL** |
| [IDENTITY_REQUIREMENTS.md](product/identity/IDENTITY_REQUIREMENTS.md)     | Functional identity, auth, verification, and session requirements |        **PROPOSED**        |
| [ONBOARDING_REQUIREMENTS.md](product/identity/ONBOARDING_REQUIREMENTS.md) | Onboarding state machine, handle policy, and interest setup       |        **PROPOSED**        |

---

## 3. Architecture Documentation (`docs/architecture/`)

| Document                                                                                                       | Purpose                                                                |             Status             |
| :------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :----------------------------: |
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md)                                                                | High-level system topology and modular monolith structure              |          **APPROVED**          |
| [API_CONVENTIONS.md](architecture/API_CONVENTIONS.md)                                                          | REST design, response envelope (`{ data, meta }`), and error contracts |   **APPROVED / IMPLEMENTED**   |
| [DATA_MODEL.md](architecture/DATA_MODEL.md)                                                                    | Core relational data model and storage boundaries                      |          **APPROVED**          |
| [REPOSITORY_STRUCTURE.md](architecture/REPOSITORY_STRUCTURE.md)                                                | Turborepo package boundaries and monorepo topology                     |          **APPROVED**          |
| **M1 Architecture Specifications:**                                                                            |                                                                        |                                |
| [IDENTITY_ARCHITECTURE.md](architecture/identity/IDENTITY_ARCHITECTURE.md)                                     | Identity module, credential decoupling, and Argon2id bounds            |          **PROPOSED**          |
| [SESSION_ARCHITECTURE.md](architecture/identity/SESSION_ARCHITECTURE.md)                                       | Dual-token model, single-flight refresh, and Redis version cache       |          **PROPOSED**          |
| [DESKTOP_OAUTH.md](architecture/identity/DESKTOP_OAUTH.md)                                                     | `nerdhub://` URI scheme, PKCE completion code, and OS keychain         |          **PROPOSED**          |
| [DATABASE_DESIGN.md](architecture/identity/DATABASE_DESIGN.md)                                                 | Proposed M1 Prisma models, constraints, and relational schema          |  **PROPOSED - NOT MIGRATED**   |
| [API_DESIGN.md](architecture/identity/API_DESIGN.md)                                                           | Proposed OpenAPI 3.1 REST contracts for `/api/v1/auth/*` and `/me`     | **PROPOSED - NOT IMPLEMENTED** |
| **Architecture Decision Records (ADRs):**                                                                      | [ADR Index](architecture/adr/README.md)                                |                                |
| [ADR 0001: Modular Monolith](architecture/adr/0001-modular-monolith.md)                                        | Monolithic backend deployment topology                                 |          **Accepted**          |
| [ADR 0002: API-First Desktop Client](architecture/adr/0002-api-first-desktop-client.md)                        | Client/server independence                                             |          **Accepted**          |
| [ADR 0003: NestJS Backend](architecture/adr/0003-backend-nestjs-modular-monolith.md)                           | NestJS framework adoption                                              |          **Accepted**          |
| [ADR 0004: PostgreSQL & Prisma](architecture/adr/0004-postgres-prisma.md)                                      | Relational database and ORM selection                                  |          **Accepted**          |
| [ADR 0005: Redis & BullMQ](architecture/adr/0005-redis-bullmq.md)                                              | Cache and background queue selection                                   |          **Accepted**          |
| [ADR 0006: Monorepo with pnpm & Turborepo](architecture/adr/0006-monorepo-pnpm-turborepo.md)                   | Monorepo task orchestration                                            |          **Accepted**          |
| [ADR 0007: Tauri 2 + React Desktop](architecture/adr/0007-desktop-tauri-react.md)                              | Desktop shell selection                                                |          **Accepted**          |
| [ADR 0008: M1 Identity & Desktop Auth](architecture/adr/0008-m1-identity-session-and-desktop-auth-proposal.md) | Session and desktop OAuth transport proposal                           |  **Proposed (NOT Accepted)**   |

---

## 4. Engineering & Security Documentation (`docs/engineering/`)

| Document                                                                                          | Purpose                                                                |        Status         |
| :------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------- | :-------------------: |
| [PROJECT_STATUS.md](engineering/PROJECT_STATUS.md)                                                | Canonical project milestone and audit readiness tracker                |    **LIVE STATUS**    |
| [TESTING.md](engineering/TESTING.md)                                                              | Monorepo testing standards and verification requirements               |     **APPROVED**      |
| [THREAT_MODEL.md](engineering/THREAT_MODEL.md)                                                    | Foundation STRIDE threat model and security boundaries                 |     **APPROVED**      |
| [ENVIRONMENT.md](engineering/ENVIRONMENT.md)                                                      | Environment configuration and setup variables                          |     **APPROVED**      |
| [DEVELOPMENT_WORKFLOW.md](engineering/DEVELOPMENT_WORKFLOW.md)                                    | Git workflow and pull-request standards                                |     **APPROVED**      |
| **M1 Engineering Specifications:**                                                                |                                                                        |                       |
| [SECURITY_REQUIREMENTS.md](engineering/identity/SECURITY_REQUIREMENTS.md)                         | Cryptographic standards, Argon2id, and distributed rate limits         |     **PROPOSED**      |
| [THREAT_MODEL.md](engineering/identity/THREAT_MODEL.md)                                           | 20-scenario identity attack matrix and mitigations                     |     **PROPOSED**      |
| [ACCEPTANCE_CRITERIA.md](engineering/identity/ACCEPTANCE_CRITERIA.md)                             | Verifiable criteria for review findings and product journeys           |     **PROPOSED**      |
| [TESTING_STRATEGY.md](engineering/identity/TESTING_STRATEGY.md)                                   | Test pyramid, mocking strategies, and automated suites                 |     **PROPOSED**      |
| [IMPLEMENTATION_PLAN.md](engineering/identity/IMPLEMENTATION_PLAN.md)                             | Sequenced 5-phase engineering implementation roadmap                   |     **PROPOSED**      |
| **Historical Audits & Reviews:**                                                                  |                                                                        |                       |
| [M1_INDEPENDENT_ARCHITECTURE_REVIEW.md](engineering/audits/M1_INDEPENDENT_ARCHITECTURE_REVIEW.md) | First Independent Review (2026-11-09) — Verdict: Rejected              | **HISTORICAL RECORD** |
| [M1_REMEDIATION_REPORT.md](engineering/audits/M1_REMEDIATION_REPORT.md)                           | Kilo Remediation Report (2026-11-09)                                   | **HISTORICAL RECORD** |
| [M1_SECOND_INDEPENDENT_REVIEW.md](engineering/audits/M1_SECOND_INDEPENDENT_REVIEW.md)             | Second Independent Review (2026-11-09) — Verdict: Remediation Approved | **HISTORICAL RECORD** |
| [M1_PRE_IMPLEMENTATION_GATE_REPORT.md](engineering/audits/M1_PRE_IMPLEMENTATION_GATE_REPORT.md)   | Pre-Implementation Gate Report (2026-11-09)                            | **HISTORICAL RECORD** |
| [M1_FINAL_SECURITY_SIGNOFF.md](engineering/audits/M1_FINAL_SECURITY_SIGNOFF.md)                   | Final Security Sign-off & Pre-Implementation Clearance (2026-11-09)    |   **FINAL SIGNOFF**   |

---

## 5. Operations Documentation (`docs/operations/`)

| Document                                  | Purpose                                                       |    Status    |
| :---------------------------------------- | :------------------------------------------------------------ | :----------: |
| [DEPLOYMENT.md](operations/DEPLOYMENT.md) | Production infrastructure and container deployment guidelines | **APPROVED** |
| [RELEASES.md](operations/RELEASES.md)     | Desktop release management and code-signing procedures        | **APPROVED** |
