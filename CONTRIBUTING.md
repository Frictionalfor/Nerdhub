# Contributing to NerdHub

Thank you for helping build NerdHub. Contributions should make the platform more useful, welcoming, safe and maintainable.

## Before starting

1. Read `README.md` and `AGENTS.md`.
2. Review the relevant product and architecture docs.
3. Search existing issues and code before proposing a duplicate.
4. For substantial changes, open an issue or design discussion first.
5. Do not begin broad refactors without maintainer agreement.

## Contribution workflow

1. Create a focused branch from the current default branch.
2. Keep one concern per pull request.
3. Add or update tests with behavior changes.
4. Update docs, API contracts and ADRs when required.
5. Run formatting, lint, typecheck, tests and build checks.
6. Review the complete diff and remove unrelated changes.
7. Open a pull request using the repository template.

## Commit convention

Use Conventional Commits where practical:

- `feat(scope): add topic following`
- `fix(scope): prevent duplicate XP award`
- `docs(scope): clarify OAuth callback flow`
- `test(scope): cover post authorization`
- `refactor(scope): extract feed query service`
- `chore(scope): pin toolchain`

## Pull request expectations

A PR should include:
- Problem and context.
- Proposed behavior and scope.
- Linked issue or decision.
- Screenshots or short recordings for UI changes where useful.
- Tests and exact validation commands.
- Database migration and rollback considerations.
- Security/privacy implications.
- Documentation updates.
- Known limitations.

## Design and architecture changes

Changes to auth, permissions, data ownership, ledger logic, moderation, storage, API compatibility or deployment require explicit review. Significant architectural decisions require an ADR in `docs/architecture/adr/`.

## AI-assisted contributions

AI tools may assist with planning, implementation and review. The contributor remains responsible for correctness, license compliance, security and tests. Disclose substantial AI-generated code when required by the maintainers or applicable contribution policy. Never submit unreviewed output.

## Code of conduct

All contributors must follow `CODE_OF_CONDUCT.md`.
