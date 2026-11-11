# Kilo project rules

Read `/AGENTS.md` before implementation. It is the canonical source of truth.

- Follow the AI contributor attribution policy in `/AGENTS.md`; use co-author trailers only for verified, material contributions.
- Follow `/README.md`, `/docs/` and accepted ADRs.
- Inspect `git status` and existing code before edits.
- Work on one bounded task with explicit acceptance criteria.
- Do not overwrite user changes or expand scope.
- The backend owns auth, authorization, moderation, XP and virtual currency.
- Use Prisma migrations; never mutate schema manually.
- Add tests and update docs/contracts.
- Do not add microservices/Kubernetes or new infrastructure without an ADR.
- Keep secrets out of code, logs, renderer and prompts.
- Run relevant checks and inspect the full diff.
- Report exact commands and results; identify anything not run.
