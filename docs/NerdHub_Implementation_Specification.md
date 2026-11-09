# NerdHub --- Implementation-Ready Product Specification

**Document:** Product Requirements, Architecture, Database, API,
Milestones and Coding-Agent Instructions\
**Version:** 1.0\
**Status:** Baseline specification for implementation\
**Product:** NerdHub\
**Tagline:** A place where curiosity has no boundaries.\
**Product model:** Open-source core, independently operated official
service\
**Initial client:** Desktop\
**Authentication:** Email/password plus multiple OAuth/OIDC providers\
**Infrastructure:** Hybrid cloud and self-hosted services

------------------------------------------------------------------------

# 0. Executive decisions

## 0.1 Product definition

NerdHub is a cross-disciplinary community and creation ecosystem for
curious people. It combines technical and general-interest discussions,
idea sharing, publishing, projects, challenges, gamification, identity
customization, specialist communities, opportunities, resources, events
and learning.

It is not limited to software developers. Its subject model must
accommodate computer science, mathematics, science, engineering, art,
philosophy, hardware, research and future domains without requiring a
schema change for every new subject.

## 0.2 Product principles

1.  Curiosity over credentials: participation is not restricted by
    education, profession or experience.
2.  Knowledge over popularity: quality and usefulness matter more than
    raw engagement.
3.  Merit over money: paid cosmetics never grant competitive advantage
    or expertise.
4.  Attribution matters: authorship, citations, licenses and
    contribution history are first-class concepts.
5.  Safety by design: reporting, blocking, moderation, privacy and
    auditability are foundational.
6.  Extensibility: topics, challenge types, content types and
    integrations should be extensible.
7.  Open core: core application code and self-hosting instructions are
    public; official hosted operations may include proprietary
    operational services.
8.  Progressive complexity: the first-run experience must be
    approachable; advanced capabilities should not overwhelm new
    members.
9.  Portable identity and data: users should be able to export their
    data.
10. Accessibility: keyboard navigation, readable contrast, scalable text
    and assistive technology support are required.

## 0.3 Explicit non-goals for the first release

-   A general-purpose code execution service.
-   Real-time voice/video rooms.
-   Native iOS/Android applications.
-   A full learning management system.
-   A marketplace with cash payouts.
-   Microservices or Kubernetes.
-   AI-generated content as a core dependency.
-   A custom programming judge capable of safely running arbitrary code.
-   A decentralized/federated social protocol.
-   Public APIs for every internal operation.

These may be considered after the MVP has real usage and operational
evidence.

------------------------------------------------------------------------

# 1. Goals, users and success criteria

## 1.1 User groups

### Curious beginner

Wants to ask questions, find welcoming communities, follow topics and
learn without being judged for lack of experience.

### Builder

Wants to publish ideas, showcase projects, recruit collaborators and
document progress.

### Specialist

Wants high-quality discussions, technical writing, research exchange and
domain-specific challenges.

### Educator or mentor

Wants to publish resources, answer questions, run learning activities
and support other members.

### Club organizer

Wants to manage a specialist community, membership, events, discussions
and club-specific challenges.

### Organization or opportunity publisher

Wants to publish legitimate collaboration, research, internship,
volunteer or employment opportunities.

### Moderator

Wants safe, auditable tools to review reports, manage content and
enforce community rules.

## 1.2 MVP goals

The first public release must let a user:

-   Install and launch NerdHub on a supported desktop OS.
-   Create an account or sign in using supported identity providers.
-   Complete onboarding and choose interests.
-   Discover and follow topics.
-   Publish a discussion, question or idea.
-   Comment, react, bookmark and report content.
-   Publish a basic long-form blog.
-   Maintain a profile with interests and links.
-   Earn transparent XP for a limited set of validated actions.
-   View basic achievements and leaderboards.
-   Receive in-app notifications.
-   Customize a profile with a small initial cosmetic catalogue.
-   Export or request deletion of their account data.

## 1.3 MVP exclusions

Challenges with arbitrary code execution, paid cosmetics, DMs, club
chat, opportunity applications, event ticketing, Academy courses and
mobile apps are not required for v0.1.

## 1.4 Product health metrics

Measure quality, not addictive engagement.

-   Activation: percentage completing onboarding and performing a
    meaningful action.
-   First contribution time.
-   Weekly active contributors, not only weekly active viewers.
-   Question response rate and time to first useful response.
-   Percentage of discussions receiving meaningful replies.
-   Blog completion and reading quality signals.
-   Idea-to-collaboration conversion.
-   Report volume, moderation response time and repeat abuse.
-   Retention by interest area.
-   Accessibility and crash-free session rate.

Do not optimize for time spent, notification opens or raw post volume in
isolation.

------------------------------------------------------------------------

# 2. Product modules and functional requirements

Priority key: **P0** required for MVP; **P1** next releases; **P2**
later ecosystem.

## 2.1 Identity and authentication --- P0

Requirements:

-   Email/password registration and login.
-   Email verification.
-   Password reset with expiring, single-use tokens.
-   OAuth/OIDC login through GitHub and Google initially; provider
    adapter must support Microsoft, Discord and additional OIDC
    providers.
-   Passkeys/WebAuthn as a planned provider.
-   Secure session revocation and sign-out-all-devices.
-   Optional TOTP MFA after MVP foundation.
-   Account linking only after the user proves control of both
    identities.
-   Rate limits and abuse controls for login, registration and recovery.
-   No provider access token exposed to the renderer or logged.
-   OAuth desktop flow uses system browser, PKCE/state/nonce, and a
    verified app deep-link callback or localhost callback with strict
    state validation.

Acceptance criteria: - Invalid, expired and reused verification/reset
tokens are rejected. - A user can see and revoke active sessions. -
OAuth callback validates state and PKCE. - Provider failure does not
create a partially linked account. - Email addresses are normalized and
unique according to documented case-insensitive rules.

## 2.2 Onboarding and interests --- P0

-   Select display name and unique handle.
-   Choose at least one interest, but allow skipping.
-   Select experience level per interest as optional self-description,
    not verified expertise.
-   Follow suggested topics and clubs.
-   Configure notification preferences.
-   Explain XP, reputation and cosmetics clearly.
-   Allow onboarding to be resumed.

## 2.3 Profiles --- P0

-   Avatar, banner, bio, handle and display name.
-   Interest tags and external links.
-   Featured projects and articles (P1).
-   Equipped frame and profile theme.
-   Public profile visibility settings.
-   Block and report controls.
-   Profile activity summary with privacy controls.
-   Never expose email or private account identifiers publicly.

## 2.4 Topic taxonomy and discovery --- P0

-   Hierarchical topics with parent-child relationships.
-   A content item can have multiple topics.
-   Users can follow/unfollow topics.
-   Topics can be created by administrators/moderators initially.
-   Search people, topics and content.
-   Feed modes: Following, Latest and Recommended (recommendation can
    initially be rule-based).
-   Pagination uses cursor-based pagination.
-   Topic slugs are stable; display names can change.

Initial taxonomy examples: - Computer Science - Algorithms and Data
Structures - Operating Systems - Databases - Compilers and Languages -
Networks - Mathematics - Algebra - Calculus - Number Theory -
Statistics - Engineering - Electronics - Robotics - Mechanical - Civil -
Natural Sciences - Physics - Chemistry - Biology - Astronomy -
Humanities - Philosophy - Linguistics - History - Creative disciplines -
Design - Music - Writing - Game Development

The taxonomy is seed data, not a hardcoded enum.

## 2.5 Community content --- P0

Content types: - Discussion - Question - Idea

Common capabilities: - Title, body, author, visibility, status,
timestamps. - Markdown or structured rich-text body with safe
rendering. - Topics and tags. - Comments/replies. - Reactions. -
Bookmarks. - Edit history. - Report action. - Soft deletion with
moderation/audit semantics. - Content attribution and source links. -
Attachment metadata; upload pipeline must validate MIME, size and file
signatures.

Questions: - Accepted answer. - Resolved/unresolved state. - Answer
sorting. - Accepted answer does not imply global correctness outside the
question context.

Ideas: - Problem, proposed solution, expected impact, skills sought and
status. - Lifecycle: concept, feedback, seeking collaborators, in
development, prototype, released, archived. - Idea updates and
collaborator requests are P1 if scope pressure requires it.

Discussions: - General threaded conversation. - Pinning by authorized
moderators. - Locking and slow mode as moderation controls.

## 2.6 Blogs and publishing --- P0 basic, P1 advanced

MVP: - Draft and publish article. - Markdown editor with preview. - Code
blocks and syntax highlighting. - Topics, tags, cover image and
excerpt. - Reading time estimate. - Comments and reactions. - Author
page and article listing.

P1: - Article series. - Revision history. - Scheduled publishing. -
LaTeX rendering using KaTeX. - Diagrams and safe embeds. -
Citations/references. - Draft autosave and collaborative editing
(later).

## 2.7 Projects --- P1

-   Project page with title, description, status, topics, links and
    media.
-   Owner and contributor roles.
-   Roadmap and release notes.
-   Link project to originating idea.
-   Collaboration request workflow.
-   GitHub integration must use least-privilege OAuth scopes and clearly
    explain data access.

## 2.8 Challenges and competitions --- P1/P2

Initial challenge metadata and non-executable formats can be implemented
before a code judge: - Multiple-choice. - Written response. -
Proof/explanation. - Project submission. - Peer-reviewed submission.

Later coding judge: - Separate isolated execution infrastructure. - No
execution in API process or ordinary worker. - Ephemeral sandbox per
submission. - CPU, memory, process, filesystem and wall-clock limits. -
No network by default. - Seccomp/container/VM isolation reviewed by
security specialists. - Test data hidden from submitter. - Idempotent
scoring and immutable submission results. - Appeals and manual review. -
Never claim arbitrary-code sandbox is safe merely because it uses
Docker.

## 2.9 Gamification and cosmetics --- P0 basic, P1 expanded

Separate systems: - XP: progression points. - Reputation: quality/trust
signals, not a single expertise score. - Achievements: verifiable
milestones. - NerdCoins: optional cosmetic currency only.

Rules: - XP is an append-only ledger. - Reward events are idempotent. -
Every reward has a reason/source and policy version. - Reversals use
compensating ledger entries; do not silently mutate history. - Coins
cannot buy XP, reputation, challenge outcomes or leaderboard
placement. - Cosmetic ownership and equipped cosmetic are separate. -
Cosmetic rarity is presentation, not status verification. - Rate-limit
repeatable actions and detect collusion, spam and self-dealing. -
Leaderboards can be global, time-bounded and topic-specific. - Seasonal
leaderboards must not erase lifetime history.

MVP XP rules should be conservative and configurable in admin settings.
Suggested initial examples (subject to abuse testing): - Validated first
question: 5 XP. - Accepted answer: 10 XP. - Helpful answer reaction
threshold: small capped bonus. - Published article passing minimum
quality/moderation criteria: 15 XP. - Completed non-code challenge:
challenge-specific award. - No XP for raw login, views, follows or
unlimited reactions.

## 2.10 Clubs --- P1

-   Public/private club.
-   Owner, moderator and member roles.
-   Membership requests and invitations.
-   Club topic association.
-   Club feed and announcements.
-   Club-specific events/challenges later.
-   Club moderation remains subordinate to platform policy.

## 2.11 Opportunities --- P1

Types: employment, internship, research, volunteer, project
collaborator, mentor and competition teammate.

Fields: role, description, skills, level, compensation classification,
location mode, time commitment, deadline, publisher, verification status
and application instructions.

Trust requirements: - Report listing. - Publisher verification. - Scam
and impersonation review. - Clearly distinguish paid, unpaid and
volunteer work. - No collection of unnecessary sensitive applicant
data. - Do not imply endorsement merely because a listing is hosted.

## 2.12 Resources, events and Academy --- P1/P2

Resources: - Curated links, books, papers, documentation, datasets and
tutorials. - Collections and attribution. - Broken-link reporting.

Events: - Online/offline, timezone-aware date/time, registration and
organizer. - Capacity and cancellation support.

Academy: - Learning paths, lessons, prerequisites, exercises and
progress. - Content should link to discussions, resources and
challenges.

## 2.13 Messaging and notifications --- P1

-   In-app notifications first.
-   Email notification preferences.
-   DMs and group messages only after block/report/abuse controls.
-   Notification deduplication and user-controlled categories.
-   No push-notification spam.
-   Real-time delivery is an enhancement; durable notification records
    are authoritative.

## 2.14 Administration and moderation --- P0

-   Report queue and triage.
-   Content/user actions with reason codes.
-   Role-based permissions.
-   Appeals and review history.
-   Audit log.
-   Topic/tag management.
-   XP policy configuration.
-   User suspension and ban workflows.
-   Moderator actions must be traceable and least-privileged.
-   Moderators must not see private user data unless required for a
    documented case.

------------------------------------------------------------------------

# 3. Desktop application and UX specification

## 3.1 Desktop technology

-   Tauri 2 shell.
-   React + TypeScript + Vite renderer.
-   Rust only for Tauri commands, OS integration and secure local
    capabilities.
-   TanStack Router or React Router.
-   TanStack Query for server state.
-   Zustand only for small client UI state; avoid duplicating server
    state.
-   Tailwind CSS and shadcn/ui primitives.
-   Motion for purposeful animation.
-   TipTap or Markdown-first editor; select one after a small technical
    spike.
-   SQLite for local cache/drafts only if offline requirements justify
    it; server PostgreSQL remains source of truth.

Do not embed the NestJS backend inside the desktop app. Do not store
privileged service secrets in the client.

## 3.2 Navigation

Primary: - Home - Explore - Community - Idea Lab - Blogs - Projects -
Challenges - Rankings - Nerd Clubs - Opportunities - Resources -
Events - Academy

Secondary: - Search - Create - Notifications - Messages (when
released) - Profile - Settings

For MVP, show unavailable modules as roadmap entries only if useful; do
not ship dead navigation.

## 3.3 Visual design

-   Dark-first, light mode supported.
-   Deep neutral surfaces, restrained violet primary accent, cyan
    secondary accent.
-   Geist or Inter typography.
-   Lucide icons.
-   Dense but readable information layouts.
-   Consistent spacing, focus states, hover states and loading
    skeletons.
-   Respect reduced-motion setting.
-   Keyboard-first navigation and accessible dialogs.
-   No excessive glassmorphism, neon or decorative animation.
-   Responsive layouts for different desktop window sizes.

## 3.4 Offline behavior

MVP: - Draft composition should survive app restart. - Cache user
profile and recently viewed content where practical. - Clearly display
offline state. - Queue safe draft operations only; do not silently queue
reactions, rewards, account changes or other non-idempotent actions. -
Resolve edit conflicts explicitly. - Never present stale cached data as
live.

## 3.5 Supported desktop platforms

Initial target: Linux, Windows and macOS builds. Linux development
should be tested on the project's declared supported distributions and
Wayland/X11 environments. Publish a support matrix and test packages
before claiming broad compatibility.

------------------------------------------------------------------------

# 4. Technical architecture

## 4.1 Architectural style

Use a **modular monolith** for the API, plus a separate background
worker process. Modules share one PostgreSQL database but must have
explicit ownership boundaries. This provides simpler deployment and
transactions without preventing later extraction.

## 4.2 Logical architecture

``` text
Tauri Desktop Client
  └── React + TypeScript Renderer
       ├── Feature modules
       ├── Shared UI/design system
       ├── API client
       └── Local draft/cache adapter
                |
                | HTTPS REST / OpenAPI
                v
         NestJS API Service
           ├── Identity
           ├── Profiles
           ├── Taxonomy
           ├── Content
           ├── Publishing
           ├── Ideas
           ├── Gamification
           ├── Cosmetics
           ├── Discovery
           ├── Notifications
           ├── Moderation
           └── Admin
                |
       ┌────────┼─────────┐
       v        v         v
   PostgreSQL  Redis   Object Storage
       |
       v
  Background Worker
   ├── Email delivery
   ├── Notification fan-out
   ├── Image processing
   ├── Search indexing
   ├── Leaderboard snapshots
   └── Cleanup/retention jobs
```

## 4.3 Recommended stack

  -----------------------------------------------------------------------
  Layer                               Choice
  ----------------------------------- -----------------------------------
  Desktop                             Tauri 2

  Frontend                            React, TypeScript, Vite

  Routing                             TanStack Router

  Server state                        TanStack Query

  UI                                  Tailwind CSS, shadcn/ui

  Backend                             NestJS, TypeScript

  API                                 REST, OpenAPI 3.1

  Validation                          Zod at client boundary;
                                      class-validator or Zod consistently
                                      on API

  Database                            PostgreSQL

  ORM                                 Prisma

  Cache/queues                        Redis + BullMQ

  Realtime                            Socket.IO later

  Search MVP                          PostgreSQL full-text search

  Search later                        Meilisearch or OpenSearch after
                                      measurement

  Storage                             S3-compatible object storage

  Email                               Provider adapter; local development
                                      mail catcher

  Tests                               Vitest, Supertest, Playwright, Rust
                                      tests

  Observability                       OpenTelemetry, structured logs,
                                      error reporting

  Deployment                          Docker Compose initially

  CI                                  GitHub Actions
  -----------------------------------------------------------------------

Do not introduce Kafka, Kubernetes, Elasticsearch or multiple databases
before a measured need exists.

## 4.4 Hybrid infrastructure

Recommended environments: - Local development: Docker Compose
services. - Preview/staging: low-cost hosted VM or managed service. -
Production: API and worker on a reliable host; managed PostgreSQL if
affordable; object storage for uploads; Redis managed or self-hosted
based on operations capacity. - Optional self-hosted deployment:
documented Compose profile.

Hybrid means portability and operational choice, not unnecessary
duplication. Select one production source of truth for each service.

## 4.5 Security boundaries

-   TLS for all remote traffic.
-   Secrets only in server-side secret storage/environment.
-   Argon2id password hashing.
-   OAuth authorization code + PKCE.
-   Secure, HTTP-only cookies for browser clients; desktop token/session
    handling must be reviewed for Tauri.
-   CSRF protections where cookies are used.
-   Strict CORS allowlist.
-   Content Security Policy.
-   Input validation at every API boundary.
-   Output encoding and safe Markdown sanitization.
-   File signature checks, size limits, image re-encoding and malware
    scanning where feasible.
-   Rate limits by IP, account and action.
-   Audit sensitive actions.
-   Encrypt backups and test restores.
-   Dependency and container scanning in CI.
-   No arbitrary code execution in API or worker.
-   Data export and account deletion workflows.

------------------------------------------------------------------------

# 5. Monorepo structure

Use pnpm workspaces and Turborepo for JavaScript/TypeScript tasks. Keep
Rust Tauri code in the desktop app. Use a single lockfile.

``` text
nerdhub/
├── apps/
│   ├── desktop/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── routes/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── onboarding/
│   │   │   │   ├── feed/
│   │   │   │   ├── topics/
│   │   │   │   ├── discussions/
│   │   │   │   ├── questions/
│   │   │   │   ├── ideas/
│   │   │   │   ├── blogs/
│   │   │   │   ├── profiles/
│   │   │   │   ├── gamification/
│   │   │   │   └── notifications/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── src-tauri/
│   │   ├── tests/
│   │   └── package.json
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   ├── infrastructure/
│   │   │   └── modules/
│   │   │       ├── identity/
│   │   │       ├── profiles/
│   │   │       ├── taxonomy/
│   │   │       ├── content/
│   │   │       ├── comments/
│   │   │       ├── reactions/
│   │   │       ├── publishing/
│   │   │       ├── ideas/
│   │   │       ├── gamification/
│   │   │       ├── cosmetics/
│   │   │       ├── discovery/
│   │   │       ├── notifications/
│   │   │       ├── moderation/
│   │   │       └── admin/
│   │   └── test/
│   └── worker/
│       └── src/
│           ├── jobs/
│           ├── processors/
│           └── main.ts
├── packages/
│   ├── api-client/
│   ├── contracts/
│   ├── validation/
│   ├── ui/
│   ├── design-tokens/
│   ├── editor/
│   ├── config/
│   └── test-utils/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
├── infra/
│   ├── docker/
│   ├── compose/
│   ├── monitoring/
│   └── scripts/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── security/
│   ├── operations/
│   └── decisions/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

Rules: - `apps/desktop` must not import Prisma or server-only
packages. - `apps/api` owns business rules and persistence. -
`apps/worker` invokes application services or shared domain services; it
must not duplicate reward logic. - `packages/contracts` contains API
DTOs and shared types, not database models. - Avoid circular imports. -
Every module owns its controllers, services, DTOs, policies and tests. -
Do not create a generic `utils` dumping ground.

------------------------------------------------------------------------

# 6. Database specification

Use PostgreSQL with UUID primary keys, `timestamptz` timestamps, foreign
keys, unique constraints and indexes. Store timestamps in UTC. Use soft
deletion only where recovery/moderation history requires it; define
retention and hard-deletion behavior.

The following is the canonical MVP relational model. Prisma schema is
the implementation source of truth; SQL snippets are illustrative
constraints and indexes to preserve during migration review.

## 6.1 Identity

### users

-   id UUID PK
-   email CITEXT UNIQUE NOT NULL
-   email_verified_at timestamptz nullable
-   password_hash text nullable
-   status enum: pending, active, suspended, banned, deletion_pending,
    deleted
-   created_at, updated_at timestamptz
-   last_login_at timestamptz nullable

### accounts

External identity connections: - id UUID PK - user_id UUID FK users -
provider text - provider_account_id text - access_token_encrypted text
nullable - refresh_token_encrypted text nullable - token_expires_at
timestamptz nullable - created_at, updated_at - UNIQUE(provider,
provider_account_id) - UNIQUE(user_id, provider, provider_account_id)

Do not persist OAuth tokens unless a feature requires them. Encrypt
tokens at rest and request minimum scopes.

### sessions

-   id UUID PK
-   user_id UUID FK
-   token_hash text UNIQUE
-   device_label text nullable
-   expires_at timestamptz
-   revoked_at timestamptz nullable
-   created_at timestamptz
-   last_seen_at timestamptz

### auth_tokens

-   id UUID PK
-   user_id UUID FK
-   token_hash text UNIQUE
-   purpose enum: verify_email, reset_password, link_account
-   expires_at timestamptz
-   consumed_at timestamptz nullable
-   created_at timestamptz

### profiles

-   user_id UUID PK/FK users
-   handle CITEXT UNIQUE
-   display_name text
-   bio text nullable
-   avatar_asset_id UUID nullable
-   banner_asset_id UUID nullable
-   visibility enum: public, members, private
-   equipped_frame_id UUID nullable
-   equipped_theme_id UUID nullable
-   created_at, updated_at

### user_links

-   id UUID PK
-   user_id UUID FK
-   label text
-   url text
-   sort_order int
-   UNIQUE(user_id, sort_order)

### user_interests

-   user_id UUID FK
-   topic_id UUID FK
-   proficiency_label enum: exploring, beginner, intermediate, advanced,
    expert nullable
-   created_at
-   PK(user_id, topic_id)

Self-reported proficiency must not be presented as verified expertise.

### roles / user_roles

-   roles(id, key UNIQUE, description)
-   user_roles(user_id FK, role_id FK, granted_by UUID nullable,
    granted_at, PK(user_id, role_id))

Use permission policies rather than hardcoding role names in every
controller.

## 6.2 Taxonomy

### topics

-   id UUID PK
-   parent_id UUID nullable FK topics
-   name text
-   slug CITEXT UNIQUE
-   description text nullable
-   status enum: active, archived
-   created_at, updated_at

### topic_follows

-   user_id UUID FK
-   topic_id UUID FK
-   created_at
-   PK(user_id, topic_id)

### tags

-   id UUID PK
-   name CITEXT UNIQUE
-   slug CITEXT UNIQUE

Content-to-topic and content-to-tag joins are defined below.

## 6.3 Content

### posts

Common content for discussion, question and idea: - id UUID PK -
author_id UUID FK users - type enum: discussion, question, idea - title
text - body_json jsonb - body_text text - status enum: draft, published,
locked, hidden, deleted - visibility enum: public, members, unlisted -
created_at, updated_at, published_at nullable - edited_at nullable -
deleted_at nullable - metadata jsonb default {} - version int default 1

`body_json` is structured editor data. `body_text` is sanitized plain
text for search. Never trust client-provided sanitized HTML.

### post_topics

-   post_id UUID FK posts
-   topic_id UUID FK topics
-   PK(post_id, topic_id)

### post_tags

-   post_id UUID FK posts
-   tag_id UUID FK tags
-   PK(post_id, tag_id)

### comments

-   id UUID PK
-   post_id UUID FK posts
-   author_id UUID FK users
-   parent_id UUID nullable FK comments
-   body_json jsonb
-   body_text text
-   status enum: visible, hidden, deleted
-   created_at, updated_at, deleted_at nullable

Limit nesting depth in application logic; use parent-child threads.

### reactions

-   id UUID PK
-   user_id UUID FK users
-   target_type enum: post, comment, article
-   target_id UUID
-   reaction_type enum: helpful, insightful, celebrate, like
-   created_at
-   UNIQUE(user_id, target_type, target_id, reaction_type)

Because polymorphic target IDs cannot have a normal FK, validate target
existence in a service transaction. Alternatively use separate typed
join tables if stronger referential integrity is preferred.

### bookmarks

-   user_id UUID FK
-   target_type enum: post, article, project, resource
-   target_id UUID
-   created_at
-   PK(user_id, target_type, target_id)

### question_answers

-   id UUID PK
-   post_id UUID FK posts UNIQUE
-   accepted_comment_id UUID nullable FK comments
-   resolved_at timestamptz nullable
-   resolved_by UUID nullable FK users

If answers are represented as comments, enforce that accepted comment
belongs to the same post.

### post_revisions

-   id UUID PK
-   post_id UUID FK posts
-   editor_id UUID FK users
-   version int
-   body_json jsonb
-   body_text text
-   created_at
-   UNIQUE(post_id, version)

## 6.4 Blogs

### articles

-   id UUID PK
-   author_id UUID FK users
-   slug CITEXT UNIQUE
-   title text
-   excerpt text nullable
-   body_json jsonb
-   body_text text
-   cover_asset_id UUID nullable
-   status enum: draft, published, archived
-   visibility enum: public, members, unlisted
-   published_at timestamptz nullable
-   created_at, updated_at
-   reading_time_minutes int nullable

### article_topics

-   article_id UUID FK
-   topic_id UUID FK
-   PK(article_id, topic_id)

### article_revisions

-   id UUID PK
-   article_id UUID FK
-   editor_id UUID FK users
-   version int
-   snapshot_json jsonb
-   created_at
-   UNIQUE(article_id, version)

## 6.5 Idea Lab

### ideas

-   post_id UUID PK/FK posts
-   problem_statement text
-   proposed_solution text
-   expected_impact text nullable
-   status enum: concept, feedback, seeking_collaborators,
    in_development, prototype, released, archived
-   license_id UUID nullable
-   updated_at

### idea_collaborators

-   idea_id UUID FK ideas
-   user_id UUID FK users
-   role text
-   status enum: invited, requested, accepted, declined, removed
-   created_at, updated_at
-   PK(idea_id, user_id)

### idea_updates

-   id UUID PK
-   idea_id UUID FK ideas
-   author_id UUID FK users
-   title text
-   body_json jsonb
-   created_at

## 6.6 Projects (P1)

### projects

-   id UUID PK
-   owner_id UUID FK users
-   originating_idea_id UUID nullable FK ideas
-   slug CITEXT UNIQUE
-   name text
-   description text
-   status enum: planning, active, paused, released, archived
-   visibility enum: public, members, private
-   repository_url text nullable
-   demo_url text nullable
-   created_at, updated_at

### project_members

-   project_id UUID FK
-   user_id UUID FK users
-   role enum: owner, maintainer, contributor
-   joined_at
-   PK(project_id, user_id)

### project_releases

-   id UUID PK
-   project_id UUID FK
-   version text
-   title text
-   notes text
-   released_at timestamptz

## 6.7 Gamification

### xp_transactions

-   id UUID PK
-   user_id UUID FK users
-   amount int NOT NULL
-   reason_code text
-   source_type text
-   source_id UUID nullable
-   idempotency_key text UNIQUE
-   policy_version text
-   created_at
-   reversal_of UUID nullable FK xp_transactions
-   metadata jsonb default {}

Ledger is append-only. Enforce authorization and permitted reversal
rules in the service.

### user_progress

-   user_id UUID PK/FK users
-   total_xp bigint
-   current_level int
-   updated_at

This is a derived cache. Reconciliation must be possible from ledger
entries.

### achievements

-   id UUID PK
-   key CITEXT UNIQUE
-   name text
-   description text
-   icon_asset_id UUID nullable
-   criteria_json jsonb
-   active boolean
-   created_at

### user_achievements

-   user_id UUID FK
-   achievement_id UUID FK
-   awarded_at timestamptz
-   evidence_json jsonb
-   PK(user_id, achievement_id)

### nerdcoin_transactions

-   id UUID PK
-   user_id UUID FK users
-   amount int
-   reason_code text
-   idempotency_key text UNIQUE
-   source_type text
-   source_id UUID nullable
-   created_at
-   reversal_of UUID nullable FK nerdcoin_transactions

### user_wallets

-   user_id UUID PK/FK users
-   balance bigint
-   updated_at

Derived from the coin ledger; update atomically with ledger insertion.

### leaderboard_snapshots

-   id UUID PK
-   scope_type enum: global, topic, weekly, monthly, seasonal
-   scope_id UUID nullable
-   period_start timestamptz nullable
-   period_end timestamptz nullable
-   generated_at timestamptz
-   entries_json jsonb

For large leaderboards, migrate to normalized snapshot rows rather than
one JSON document.

## 6.8 Cosmetics

### cosmetics

-   id UUID PK
-   key CITEXT UNIQUE
-   name text
-   type enum: avatar_frame, banner, theme, badge, decoration
-   rarity enum: common, uncommon, rare, epic, legendary
-   asset_id UUID nullable
-   acquisition_type enum: achievement, event, earned, grant, purchase
-   active boolean
-   metadata jsonb
-   created_at

### user_cosmetics

-   user_id UUID FK users
-   cosmetic_id UUID FK cosmetics
-   acquired_at timestamptz
-   acquisition_source text
-   PK(user_id, cosmetic_id)

### cosmetic_equipment

-   user_id UUID PK/FK users
-   frame_id UUID nullable FK cosmetics
-   banner_id UUID nullable FK cosmetics
-   theme_id UUID nullable FK cosmetics
-   updated_at

Validate that equipped cosmetic belongs to user and matches slot type.

## 6.9 Assets

### assets

-   id UUID PK
-   owner_id UUID FK users
-   storage_key text UNIQUE
-   media_type text
-   size_bytes bigint
-   checksum text
-   width int nullable
-   height int nullable
-   status enum: pending, processing, ready, rejected
-   created_at

Never accept arbitrary storage keys from clients. Generate them
server-side. Store metadata, not binary blobs, in PostgreSQL.

## 6.10 Notifications and moderation

### notifications

-   id UUID PK
-   recipient_id UUID FK users
-   actor_id UUID nullable FK users
-   type text
-   entity_type text nullable
-   entity_id UUID nullable
-   payload_json jsonb
-   read_at timestamptz nullable
-   created_at
-   dedupe_key text nullable UNIQUE

### notification_preferences

-   user_id UUID PK/FK users
-   preferences_json jsonb
-   updated_at

### reports

-   id UUID PK
-   reporter_id UUID FK users
-   target_type text
-   target_id UUID
-   reason_code text
-   details text nullable
-   status enum: open, reviewing, actioned, dismissed
-   created_at, updated_at

### moderation_actions

-   id UUID PK
-   moderator_id UUID FK users
-   target_user_id UUID nullable FK users
-   target_type text
-   target_id UUID nullable
-   action_type text
-   reason text
-   expires_at timestamptz nullable
-   created_at

### audit_logs

-   id UUID PK
-   actor_id UUID nullable FK users
-   action text
-   target_type text
-   target_id UUID nullable
-   request_id text nullable
-   metadata_json jsonb
-   created_at

Audit logs must not store passwords, raw tokens or unnecessary sensitive
data.

## 6.11 Future domain tables

P1/P2 additions: - clubs, club_memberships, club_roles - opportunities,
opportunity_applications, organization_profiles, verification_reviews -
events, event_registrations, event_teams - resources,
resource_collections, collection_items - learning_paths, lessons,
lesson_progress - conversations, conversation_members, messages -
challenge_sets, challenges, challenge_submissions, challenge_reviews,
challenge_results

Do not create all future tables in the first migration. Add them when
the corresponding module is approved for implementation.

## 6.12 Required indexes and constraints

At minimum: - users(email), profiles(handle) - posts(status,
published_at DESC), posts(author_id, created_at DESC) -
comments(post_id, created_at) - post_topics(topic_id, post_id) -
articles(status, published_at DESC), articles(author_id, created_at
DESC) - xp_transactions(user_id, created_at DESC) -
notifications(recipient_id, created_at DESC) - reports(status,
created_at) - assets(owner_id, created_at) - GIN full-text index on
normalized post/article search vectors - Unique idempotency keys for all
reward operations. - Check constraints for positive file sizes, valid
balances and sensible ranges. - Foreign keys with deliberate delete
behavior; do not cascade-delete audit/ledger history.

------------------------------------------------------------------------

# 7. API specification

Base path: `/api/v1`\
Format: JSON\
Authentication: secure session or bearer access token according to
client flow\
All timestamps: ISO 8601 UTC\
IDs: UUID\
Pagination: cursor-based\
Errors: consistent problem-details-style object\
Versioning: additive changes preferred; breaking changes require a
version plan.

## 7.1 Standard response shapes

Success:

``` json
{
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

Paginated:

``` json
{
  "data": [],
  "page": {
    "nextCursor": "opaque-cursor-or-null",
    "hasMore": false
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

Error:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": [],
    "requestId": "uuid"
  }
}
```

Never expose stack traces or internal database details.

## 7.2 Authentication

-   `POST /auth/register`
-   `POST /auth/login`
-   `POST /auth/logout`
-   `POST /auth/logout-all`
-   `POST /auth/verify-email`
-   `POST /auth/resend-verification`
-   `POST /auth/password/forgot`
-   `POST /auth/password/reset`
-   `GET /auth/providers`
-   `GET /auth/oauth/:provider/start`
-   `GET /auth/oauth/:provider/callback`
-   `GET /auth/sessions`
-   `DELETE /auth/sessions/:sessionId`
-   `POST /auth/accounts/:provider/link`
-   `DELETE /auth/accounts/:provider`

OAuth start/callback must use state, nonce where applicable, PKCE,
strict redirect URI allowlists and safe desktop callback handling.

## 7.3 Current user and profiles

-   `GET /me`
-   `PATCH /me`
-   `GET /users/:handle`
-   `PATCH /me/profile`
-   `GET /me/interests`
-   `PUT /me/interests`
-   `GET /users/:handle/followers` (P1)
-   `PUT /users/:handle/follow` (P1)
-   `DELETE /users/:handle/follow` (P1)
-   `POST /users/:handle/block`
-   `DELETE /users/:handle/block`
-   `POST /users/:handle/report`

Never allow a client to update role, XP, reputation, verification status
or moderation status through profile endpoints.

## 7.4 Topics and discovery

-   `GET /topics`
-   `GET /topics/:slug`
-   `GET /topics/:slug/feed`
-   `PUT /me/topics/:topicId/follow`
-   `DELETE /me/topics/:topicId/follow`
-   `GET /feed?mode=following|latest|recommended&cursor=...`
-   `GET /search?q=...&type=...&cursor=...`

Search must enforce visibility and block/mute policies before returning
results.

## 7.5 Posts and comments

-   `POST /posts`
-   `GET /posts/:postId`
-   `PATCH /posts/:postId`
-   `DELETE /posts/:postId`
-   `GET /posts/:postId/comments`
-   `POST /posts/:postId/comments`
-   `PATCH /comments/:commentId`
-   `DELETE /comments/:commentId`
-   `PUT /posts/:postId/reactions`
-   `DELETE /posts/:postId/reactions/:reactionType`
-   `PUT /posts/:postId/bookmark`
-   `DELETE /posts/:postId/bookmark`
-   `POST /posts/:postId/report`
-   `POST /questions/:postId/accept/:commentId`
-   `DELETE /questions/:postId/accepted-answer`

Use authorization policies to ensure only the author can edit their
content, with moderator override recorded in audit logs.

## 7.6 Blogs

-   `POST /articles`
-   `GET /articles/:slug`
-   `PATCH /articles/:articleId`
-   `POST /articles/:articleId/publish`
-   `POST /articles/:articleId/unpublish`
-   `GET /users/:handle/articles`
-   `GET /articles/:articleId/revisions`
-   `POST /articles/:articleId/report`

Drafts are private to the author and authorized collaborators.

## 7.7 Ideas

-   `POST /ideas`
-   `GET /ideas/:ideaId`
-   `PATCH /ideas/:ideaId`
-   `POST /ideas/:ideaId/status`
-   `POST /ideas/:ideaId/collaborators`
-   `POST /ideas/:ideaId/collaboration-requests`
-   `GET /ideas/:ideaId/updates`
-   `POST /ideas/:ideaId/updates`

Only authorized owners/collaborators can update private idea details.
Public idea status transitions must be validated.

## 7.8 Gamification

Read-only for clients: - `GET /users/:handle/progress` -
`GET /users/:handle/achievements` - `GET /leaderboards` -
`GET /leaderboards/:scope`

Internal service operations: - Award XP through validated domain events,
not a public arbitrary `POST /xp`. - Reverse rewards through authorized
audited admin workflow. - Reconcile progress from ledger.

Do not expose an endpoint that accepts an arbitrary XP amount from the
desktop client.

## 7.9 Cosmetics and assets

-   `GET /cosmetics`
-   `GET /me/cosmetics`
-   `PUT /me/cosmetics/equip`
-   `POST /assets/upload-intents`
-   `POST /assets/:assetId/complete`
-   `GET /assets/:assetId`

Upload flow: 1. Authenticated client requests an upload intent with
declared type and size. 2. API validates policy and issues a short-lived
signed upload. 3. Client uploads directly to object storage. 4. API
completion triggers file verification/processing. 5. Asset becomes
`ready` only after verification. 6. Rejected assets are not served.

## 7.10 Notifications

-   `GET /me/notifications`
-   `POST /me/notifications/:id/read`
-   `POST /me/notifications/read-all`
-   `GET /me/notification-preferences`
-   `PATCH /me/notification-preferences`

## 7.11 Moderation/admin

-   `POST /reports`
-   `GET /admin/reports`
-   `GET /admin/reports/:reportId`
-   `POST /admin/reports/:reportId/decision`
-   `POST /admin/users/:userId/suspend`
-   `POST /admin/users/:userId/ban`
-   `POST /admin/content/:contentId/hide`
-   `GET /admin/audit-logs`

Every admin endpoint requires explicit permission checks, audit logging
and reason capture.

## 7.12 API conventions

-   Validate request body, path and query parameters.
-   Use `Idempotency-Key` for operations that create rewards, purchases,
    registrations or other retry-sensitive side effects.
-   Apply request IDs and structured logs.
-   Use optimistic concurrency/version fields for edits where
    appropriate.
-   Return `401` unauthenticated, `403` unauthorized, `404` for
    inaccessible resources where disclosure is unsafe, `409` conflicts,
    `422` validation/domain errors, `429` rate limits.
-   Generate OpenAPI from controllers and DTOs; commit generated client
    types or generate them in CI.
-   Add contract tests for critical endpoints.

------------------------------------------------------------------------

# 8. Domain events and background jobs

Use an outbox pattern for events that must not be lost between a
database commit and queue publication.

Initial domain events: - UserRegistered - EmailVerified -
ProfileUpdated - PostPublished - CommentCreated - ArticlePublished -
IdeaStatusChanged - ReactionCreated - RewardEligible -
AchievementAwarded - AssetUploaded - ReportCreated -
ModerationActionApplied

Workers: - Email delivery with retry/backoff. - Notification
generation. - Search indexing. - Image resizing and metadata
extraction. - Leaderboard snapshots. - Reward policy evaluation. -
Expired token/session cleanup. - Data export and deletion jobs.

Jobs must be idempotent, observable and bounded. Failed jobs go to a
dead-letter workflow with safe replay controls.

------------------------------------------------------------------------

# 9. Testing and quality gates

## 9.1 Required test layers

Unit: - Reward calculations. - Permission policies. - Content state
transitions. - Validation. - Topic hierarchy logic.

Integration: - Database constraints. - Auth/session flows. - Content
CRUD. - Comment ownership. - Ledger idempotency. - Moderation
decisions. - Upload intent lifecycle.

End-to-end: - Register and verify. - OAuth provider test with mocked
callback. - Onboarding. - Create discussion and comment. - Publish
article. - Follow topic. - Earn validated XP. - Equip owned cosmetic. -
Report content and moderator review.

Security: - Authorization bypass tests. - IDOR tests. - XSS/Markdown
sanitization. - CSRF/session tests. - Rate limit tests. - Upload
spoofing tests. - OAuth state/PKCE tests. - Secret scanning and
dependency scanning.

## 9.2 Definition of done

A feature is not done until: - Acceptance criteria pass. - Loading,
empty, error and success states exist. - Permissions are enforced
server-side. - Validation exists at API boundary. - Tests cover normal
and failure cases. - Accessibility basics are checked. - No secrets or
sensitive data are logged. - Documentation and OpenAPI are updated. -
Database migrations are reversible or have a documented recovery plan. -
Desktop build works on the declared development platform. - No unrelated
functionality regresses.

------------------------------------------------------------------------

# 10. Milestones and delivery plan

The milestones are outcome-based, not arbitrary calendar promises. One
developer should expect this to be a substantial multi-month project;
reduce scope rather than rushing security or quality.

## M0 --- Repository and engineering foundation

Deliver: - Monorepo and package manager. - Tauri desktop shell. - NestJS
API skeleton. - Worker skeleton. - PostgreSQL/Redis Compose
environment. - Prisma and initial migrations. - CI checks, lint,
typecheck and tests. - Architecture decision records. Exit criteria:
clean clone can install, run, test and build a desktop shell plus API
locally.

## M1 --- Identity and onboarding

Deliver: - Email/password. - Verification and password reset. - GitHub
and Google OAuth adapters. - Session management. - Profiles and
interests. - Onboarding flow. Exit criteria: end-to-end identity flows
work; session revocation and account linking are tested.

## M2 --- Topics and community

Deliver: - Topic taxonomy. - Follow topics. - Feed. - Discussions,
questions and comments. - Reactions, bookmarks and reports. - Search
baseline. Exit criteria: a member can discover a topic, publish, discuss
and report content.

## M3 --- Publishing and Idea Lab

Deliver: - Blog drafts and publishing. - Markdown editor and safe
rendering. - Idea lifecycle. - Topic tagging and content search. Exit
criteria: users can publish useful long-form content and ideas.

## M4 --- Profile identity and gamification

Deliver: - XP ledger and progress. - Basic achievements. - Leaderboard
snapshots. - Cosmetic catalogue and inventory. - Profile frames and
banners. Exit criteria: reward processing is idempotent and auditable;
cosmetics cannot grant competitive advantage.

## M5 --- Public beta hardening

Deliver: - Moderation console. - Reporting workflows. - Rate limits. -
Backup/restore test. - Observability. - Installer/update strategy. -
Accessibility and security review. Exit criteria: controlled beta can be
operated and supported.

## M6 --- Projects and clubs

Deliver: - Project pages and contributors. - Idea-to-project link. -
Clubs, membership and moderation. Exit criteria: users can form
communities and collaborate on work.

## M7 --- Challenges and opportunities

Deliver: - Non-code challenges first. - Peer-review workflow. -
Opportunities and organization verification. - Later, isolated code
judge as a separately reviewed system. Exit criteria: no unsafe code
execution path exists in the primary API.

## M8 --- Expansion

Deliver: - Events, resources, Academy. - Messaging. - Web client. -
Public API and integrations. - Mobile client assessment. Exit criteria:
expansion is driven by real user needs and operational capacity.

------------------------------------------------------------------------

# 11. Coding-agent instructions

This section is intended to be copied into the repository as
`AGENTS.md`.

## 11.1 Agent role

You are a senior software engineer working on NerdHub. Implement only
the requested milestone and preserve the architecture and product
principles in this specification.

Do not attempt to build the entire product in one pass.

## 11.2 Mandatory workflow

Before changing code: 1. Read `README.md`, `AGENTS.md`, relevant docs
and existing code. 2. Inspect the current branch, working tree and
package scripts. 3. Identify the module boundary and dependencies. 4.
Write a concise implementation plan. 5. Identify schema, API, UI,
security and test impact. 6. Ask only when a decision is genuinely
blocking; otherwise follow documented defaults.

During implementation: 1. Make small, coherent changes. 2. Follow
existing patterns unless they violate this specification. 3. Keep
business rules in backend domain/application services. 4. Keep
persistence behind module-owned repositories/services. 5. Validate all
untrusted input. 6. Enforce permissions server-side. 7. Add tests with
the feature, not afterward. 8. Update OpenAPI and docs. 9. Never
hardcode secrets, tokens or production endpoints. 10. Do not silently
change product scope.

Before completion: 1. Run formatter and lint. 2. Run typecheck. 3. Run
affected unit and integration tests. 4. Run desktop build or explain why
it cannot run. 5. Inspect `git diff` for unrelated changes and secrets.
6. Summarize files changed, behavior delivered, tests run, known
limitations and next steps.

## 11.3 Architecture rules

-   Desktop is a client, never the authority for permissions, XP,
    currency or moderation.
-   API is the source of truth for user identity and domain state.
-   Use PostgreSQL transactions for multi-row business invariants.
-   XP and currency are ledger-based and append-only.
-   All reward operations require idempotency.
-   Never trust client-provided user IDs for ownership.
-   Never trust client-provided XP, role, verification or moderation
    values.
-   Use UTC timestamps.
-   Use cursor pagination for feeds and large lists.
-   Avoid N+1 queries.
-   Avoid generic abstractions before two or more real use cases justify
    them.
-   Do not introduce microservices without an approved ADR.
-   Do not add dependencies without explaining why they are needed.
-   Do not run arbitrary user code in the API or ordinary worker.
-   Do not store binary uploads in PostgreSQL.
-   Never log secrets, passwords, access tokens or reset tokens.

## 11.4 Frontend rules

-   Use feature-oriented folders.
-   Use shared design tokens and UI primitives.
-   Handle loading, empty, error and offline states.
-   Use semantic controls and keyboard-accessible interactions.
-   Respect reduced motion.
-   Keep server state in TanStack Query.
-   Keep local UI state local.
-   Do not create fake functionality or dead buttons.
-   Avoid giant components; split by responsibility.
-   Never put authorization logic solely in the UI.

## 11.5 Backend rules

-   Controllers are thin.
-   DTO/schema validation is mandatory.
-   Domain services own business rules.
-   Permission checks are explicit and tested.
-   Use transactions for rewards, account linking and state transitions.
-   Emit domain events through an outbox where durability matters.
-   Use structured logs and request IDs.
-   Return consistent error objects.
-   Avoid leaking whether private resources exist where that could
    disclose information.

## 11.6 Database rules

-   Every schema change uses a migration.
-   Do not edit an applied migration.
-   Review generated SQL.
-   Add indexes based on query patterns.
-   Use foreign keys and deliberate delete policies.
-   Never cascade-delete financial/reputation ledgers or audit records.
-   Provide seed data only for development/demo.
-   Never put production user data in fixtures.
-   Include a migration rollback or forward-recovery note.

## 11.7 Security rules

-   Treat all user content, uploads, URLs and external provider data as
    untrusted.
-   Sanitize rendered Markdown and HTML.
-   Protect OAuth with state, PKCE and strict redirect allowlists.
-   Apply rate limits to auth, search, content creation, reactions and
    reports.
-   Validate upload signatures and enforce size limits.
-   Use least-privilege Tauri capabilities.
-   Never expose backend secrets in the desktop binary.
-   Do not claim a sandbox is secure without a documented threat model
    and review.
-   Report security concerns rather than implementing a workaround that
    weakens controls.

## 11.8 Git and delivery rules

-   Use conventional commits.
-   Keep pull requests focused.
-   Do not force-push shared branches.
-   Do not rewrite user changes.
-   Do not delete tests to make CI pass.
-   Do not suppress TypeScript errors with `any`, `@ts-ignore` or broad
    eslint disables without a documented reason.
-   Do not claim tests passed unless they were actually run.
-   Record significant architectural choices in `docs/decisions/`.

## 11.9 Required agent completion report

``` text
## Implemented
- ...

## Architecture decisions
- ...

## Files changed
- ...

## Database/API changes
- ...

## Validation
- Lint:
- Typecheck:
- Unit tests:
- Integration tests:
- Desktop build:

## Security considerations
- ...

## Known limitations
- ...

## Suggested next milestone
- ...
```

------------------------------------------------------------------------

# 12. Suggested initial development prompts

Do not ask a coding agent to implement the full PRD in one prompt. Use
these prompts sequentially.

## Prompt A --- Inspect and establish foundation

Read the NerdHub specification and repository. Implement only M0. Create
the pnpm/Turborepo monorepo, Tauri 2 React TypeScript desktop shell,
NestJS API skeleton, worker skeleton, Prisma/PostgreSQL setup, Redis
Compose service, shared contracts package, lint/typecheck/test scripts
and CI. Do not implement product features. Add README, `.env.example`,
architecture docs and an ADR for the modular monolith. Verify clean
install, local startup, tests and desktop build. Report exact commands
and results.

## Prompt B --- Identity

Implement M1 only. Add email/password authentication, email
verification, password reset, session lifecycle and GitHub/Google OAuth
provider adapters. Use secure password hashing, PKCE/state, safe desktop
callback handling, rate limits and audit events. Add profiles, handle
uniqueness, interests and onboarding. Do not implement social feeds or
gamification. Add end-to-end and security tests. Never expose secrets to
the renderer.

## Prompt C --- Community

Implement M2 only. Add taxonomy, topic following, discussion/question
posts, comments, reactions, bookmarks, reports, cursor-paginated feeds
and PostgreSQL full-text search. Enforce content visibility and
authorization server-side. Add desktop screens with loading/empty/error
states. Add tests for ownership, blocked users, hidden content and
pagination.

## Prompt D --- Blogs and Idea Lab

Implement M3 only. Add article drafts/publishing, safe Markdown
rendering, code highlighting, topic association and idea lifecycle. Keep
article and idea domain rules separate while reusing shared content
infrastructure. Add edit history and tests for draft privacy, publishing
permissions and lifecycle transitions.

## Prompt E --- Gamification and cosmetics

Implement M4 only. Add append-only XP and NerdCoin ledgers, idempotent
reward processing, progress projection, achievement awards, leaderboard
snapshots, cosmetic catalogue, ownership and equipment. No client
endpoint may award arbitrary points. Add replay, duplicate-job, reversal
and concurrency tests.

## Prompt F --- Beta hardening

Implement M5 only. Add moderation workflows, audit review, rate limits,
observability, backup/restore documentation, installer/update checks,
accessibility review, security tests and operational runbooks. Do not
add new social modules.

------------------------------------------------------------------------

# 13. Release and operational requirements

Before public beta: - Publish supported OS and version matrix. - Sign
desktop installers where platform allows. - Establish update channel and
rollback strategy. - Add crash reporting with privacy notice and opt-out
where feasible. - Add status page/incident communication process. -
Document backup frequency, retention and recovery objectives. - Perform
a real restore test. - Configure database migrations as a controlled
deployment step. - Establish moderation response ownership. - Publish
Terms, Privacy Policy, Community Guidelines and content/license
policy. - Define age eligibility and safety approach before opening
broad registration. - Provide data export and account deletion. - Review
applicable laws for the jurisdictions in which the service operates.

Open-source governance: - Choose a clear OSI-approved license for the
core. - Add `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and
`SECURITY.md`. - Separate public source configuration from production
secrets. - Document self-hosting and environment variables. - Explain
which services are part of the open-source core and which belong to the
official hosted service. - Do not imply that user-generated content is
automatically licensed under the software license.

------------------------------------------------------------------------

# 14. Final implementation order

The first engineering sprint should do only the following:

1.  Create the Git repository and project documentation.
2.  Add this specification and `AGENTS.md`.
3.  Establish the pnpm/Turborepo workspace.
4.  Create the Tauri desktop shell.
5.  Create the NestJS API and worker skeleton.
6.  Configure PostgreSQL, Redis and Prisma locally.
7.  Add CI, formatting, linting, typechecking and tests.
8.  Prove that a clean checkout can run the complete development
    environment.

Only after M0 passes should implementation begin on authentication.

**Do not build a giant dashboard full of mock buttons. Do not create
every database table in advance. Do not add AI, code execution or
microservices just because the long-term vision mentions them.**

Build a reliable foundation, then ship one coherent capability at a
time.

------------------------------------------------------------------------

# 15. Initial project acceptance checklist

-   [ ] Product name and tagline are consistent.
-   [ ] Open-source licensing decision is documented.
-   [ ] Repository contains PRD and `AGENTS.md`.
-   [ ] Monorepo installs from a clean checkout.
-   [ ] Desktop shell launches.
-   [ ] API health endpoint responds.
-   [ ] Worker starts and shuts down cleanly.
-   [ ] PostgreSQL migrations run.
-   [ ] Redis connection works.
-   [ ] CI runs lint, typecheck and tests.
-   [ ] `.env.example` contains no real secrets.
-   [ ] Local setup instructions are verified.
-   [ ] M0 exit criteria are met.

**Product promise:** NerdHub is a home for people who are curious enough
to ask, brave enough to experiment, generous enough to share, and
ambitious enough to build.
