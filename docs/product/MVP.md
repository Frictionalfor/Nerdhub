# MVP Definition and Acceptance Criteria

## Release objective

Deliver a dependable desktop-first NerdHub experience where a member can create an identity, discover topics, contribute content, publish an article and participate in transparent progression.

## P0 requirements

### Identity
- Register/login with email and password.
- Verify email and reset password using expiring single-use tokens.
- GitHub and Google OAuth/OIDC adapters.
- Secure session revocation.
- Unique normalized handle.
- Server-side authorization.

### Onboarding and profile
- Set display name and handle.
- Select interests; allow skipping and resuming.
- Edit avatar, banner, bio, interests and external links.
- Keep private account data private.

### Topics and feed
- Hierarchical topics.
- Follow/unfollow topics.
- Following and Latest feed modes.
- Search topics, users and content.

### Community
- Create discussion, question and idea.
- Comment, react, bookmark.
- Edit/delete own content under documented rules.
- Report content and block users.
- Moderator review and audit trail baseline.

### Publishing
- Create drafts and publish articles.
- Preview safely rendered Markdown.
- Edit with revision history.
- Attribute sources and display author information.

### Progression
- Backend-defined XP events.
- Transactional, idempotent append-only ledger.
- Basic achievements and progress summary.
- No client-side grant or arbitrary amount endpoint.

### Reliability and privacy
- Useful loading, empty, error and offline states.
- In-app notifications may be staged to M5 if necessary.
- Export and deletion request path must be designed before public launch.
- No secrets in renderer bundles or logs.

## Acceptance checklist

- [ ] A clean clone can install and build.
- [ ] Critical auth flows have integration/E2E tests.
- [ ] Authorization is tested for owner, non-owner and moderator.
- [ ] User-generated Markdown is sanitized and external links are safe.
- [ ] Report/block flows are usable.
- [ ] XP cannot be forged or double-awarded.
- [ ] Database migration and backup/restore procedures are documented.
- [ ] Desktop app can update or at least has a documented release/install path.
- [ ] Keyboard navigation and reduced-motion support are reviewed.
- [ ] No critical or high-severity known security issue remains open.
- [ ] Privacy policy, terms and community rules are ready before public beta.

## Explicitly defer

Do not include DMs, code execution, payments, mobile clients, complex recommendation ML or microservices in the first MVP.
