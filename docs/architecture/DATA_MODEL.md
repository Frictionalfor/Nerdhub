# Data Model Baseline

This document describes the conceptual relational model. It is not a substitute for the executable Prisma schema. Implement schema changes through reviewed Prisma migrations.

## Conventions

- PostgreSQL UUID primary keys.
- `timestamptz` for persisted timestamps; store UTC.
- Case-insensitive normalized handles and email uniqueness.
- Foreign keys and explicit delete behavior.
- Index every common filter/sort/join path after query patterns are known.
- Use soft deletion only where product, audit or legal requirements justify it.
- Never store secrets or provider tokens in public profile records.
- Keep ledgers append-only.

## Identity and access

| Entity | Purpose |
|---|---|
| users | Internal account identity, normalized email, status and timestamps |
| accounts | External provider identity mapping |
| sessions | Revocable authenticated sessions |
| auth_tokens | Hashed, expiring verification/reset tokens |
| profiles | Public display identity and profile fields |
| user_links | Validated external profile links |
| user_interests | User-to-topic interest relation |
| roles / user_roles | Server-side authorization assignments |

## Taxonomy and content

| Entity | Purpose |
|---|---|
| topics | Hierarchical subject taxonomy |
| topic_follows | User follows a topic |
| tags | Optional lightweight labels |
| posts | Discussion, question or idea content |
| post_topics / post_tags | Many-to-many associations |
| comments | Threaded or flat comments |
| reactions | Unique user reaction per target/type policy |
| bookmarks | Private saved content |
| question_answers | Answer-specific metadata if needed |
| post_revisions | Edit history and attribution |

## Publishing and Idea Lab

| Entity | Purpose |
|---|---|
| articles | Long-form publication metadata and current content |
| article_topics | Article-topic associations |
| article_revisions | Version history |
| ideas | Structured idea records |
| idea_collaborators | Explicit collaboration membership |
| idea_updates | Progress/change log |

## Progression and cosmetics

| Entity | Purpose |
|---|---|
| xp_transactions | Append-only XP ledger |
| user_progress | Derived/cached progress summary |
| achievements | Achievement definitions |
| user_achievements | Achievement awards |
| nerdcoin_transactions | Append-only cosmetic currency ledger, if enabled |
| user_wallets | Derived/cached wallet balance |
| leaderboard_snapshots | Materialized ranking snapshots |
| cosmetics | Cosmetic catalogue |
| user_cosmetics | Owned cosmetics |
| cosmetic_equipment | Equipped cosmetic slot mapping |

**Invariant:** XP and NerdCoin balances are derived from ledger entries or reconciled cached totals. Do not make a mutable balance column the only source of truth.

## Assets, notifications and moderation

| Entity | Purpose |
|---|---|
| assets | Object metadata, owner, MIME type, size, scan status and storage key |
| notifications | In-app notification records |
| notification_preferences | User notification settings |
| reports | User-submitted moderation reports |
| moderation_actions | Moderator decisions and outcomes |
| audit_logs | Sensitive administrative/security action history |
| blocks | User block relationships |

## Future domains

Add table families only when their milestone begins: projects, project_members, releases, clubs, club_members, challenges, challenge_submissions, opportunities, events, resources, learning_paths and conversations/messages.

## Integrity requirements

- Use unique constraints for handles, provider identity pairs, follows, bookmarks and idempotency keys.
- Use transactions for multi-record operations.
- Validate all foreign-key ownership and tenant/scope assumptions.
- Store immutable event/ledger identifiers.
- Do not hard-delete audit or ledger history to repair mistakes.
- Add retention and deletion/anonymization rules before public launch.

## Migration checklist

- [ ] Update conceptual model.
- [ ] Update Prisma schema.
- [ ] Generate and inspect migration SQL.
- [ ] Add constraints and indexes.
- [ ] Add migration tests / integration coverage.
- [ ] Consider existing data and rollback/forward-fix strategy.
- [ ] Update API contracts and docs.
- [ ] Verify backup/restore compatibility.
