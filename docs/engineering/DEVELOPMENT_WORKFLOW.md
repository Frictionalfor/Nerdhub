# Development Workflow

## Before coding

- Pull the latest base branch.
- Check `git status`.
- Read `AGENTS.md` and relevant docs.
- Identify a single issue/task and acceptance criteria.
- Decide whether an ADR or API/schema update is required.

## Branches and commits

Use short-lived branches and focused commits. Suggested branch prefixes: `feat/`, `fix/`, `docs/`, `test/`, `chore/`. Use Conventional Commit messages.

## Local quality gates

The workspace should expose consistent scripts, finalized during M0:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Do not document these as available until scripts exist. Add them during M0 and keep this list synchronized.

## Pull request review

Review:
- Correctness and edge cases.
- Authorization and object ownership.
- Data integrity and migrations.
- Input validation and output encoding.
- Error handling and logging.
- Accessibility and offline states.
- Performance only with evidence.
- Tests and docs.
- Full diff for unrelated changes.

## Database changes

- Never edit an applied migration.
- Generate a new migration for a new schema change.
- Inspect generated SQL.
- Test upgrade from an empty database and, where practical, from the previous release.
- Document forward-fix/rollback strategy.

## Dependency changes

Before adding a dependency:
- Confirm it is actively maintained.
- Check license and known vulnerabilities.
- Consider bundle/runtime size.
- Prefer existing platform capabilities.
- Pin through the package manager lockfile.

## Definition of done

Use the checklist in `AGENTS.md`. A green build alone is not sufficient.
