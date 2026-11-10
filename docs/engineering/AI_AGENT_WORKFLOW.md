# AI Coding-Agent Workflow: Kilo, Agy, Codex and Copilot

## Goal

Use multiple AI tools without creating conflicting implementations, inconsistent architecture or unreviewed security-sensitive code.

## Shared source of truth

1. `AGENTS.md` — canonical repository rules.
2. `docs/` — product and engineering requirements.
3. `docs/architecture/adr/` — accepted architectural decisions.
4. Issue/PR acceptance criteria — task-specific scope.
5. Tool-specific instruction files — adapters only; they must not contradict `AGENTS.md`.

If an agent instruction conflicts with an accepted ADR or `AGENTS.md`, follow the repository source of truth and report the conflict.

AI contributor attribution is governed by `AGENTS.md`. Use `Co-authored-by` only for verified, material contributions; do not attribute review-only or autocomplete-only work. When an agent materially contributes, identify that contribution in the PR or issue and follow the verification requirements in `AGENTS.md`.

## Recommended division of labor

| Tool              | Best-fit role                                                                         | Guardrail                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Codex             | Architecture review, task planning, bounded implementation, code review and debugging | Give one issue and explicit files/scope; require tests and diff review               |
| Kilo              | Primary implementation agent for scoped features and repo tasks                       | One active task owner; use repository rules and inspect changes                      |
| Antigravity (Agy) | Implementation, multi-file workflows and UI/product iteration                         | Do not concurrently edit the same files as Kilo/Codex                                |
| GitHub Copilot    | Inline completion, small refactors, explanations and test suggestions                 | Human reviews every suggestion; do not treat autocomplete as an independent reviewer |

These are workflow recommendations, not claims that one tool is technically incapable of other tasks.

## Safe sequence for a feature

1. Human writes issue and acceptance criteria.
2. Codex (or a planning pass) reviews relevant docs and proposes a bounded plan. No code edits during planning unless explicitly assigned.
3. Human selects one implementation owner: Kilo **or** Agy **or** Codex.
4. Implementer makes changes and runs tests.
5. A different tool may review the diff in read-only mode.
6. Human resolves findings and approves changes.
7. Update docs, ADRs and release notes.
8. Human commits/merges.

## Parallel work

Parallelize only independent tasks with non-overlapping files and clear interfaces. Examples:

- Agent A: desktop UI component.
- Agent B: API module with agreed contract.
- Human: integration and review.

Do not parallelize schema migrations, shared contracts or core auth without an explicit integration plan. Do not ask two agents to “build the whole app”.

## Prompt template

```text
You are working in the NerdHub repository.

First read AGENTS.md and the relevant docs. Inspect git status and the existing implementation.
Do not overwrite uncommitted work.

Task:
[one bounded task]

Acceptance criteria:
- [observable condition]
- [observable condition]

Constraints:
- Follow accepted ADRs and existing patterns.
- Do not expand scope.
- Add/update tests.
- Update relevant documentation.
- Do not add dependencies without justification.
- Do not claim checks passed unless you ran them.

Before editing, return a concise plan and list likely files.
After implementation, run relevant checks, inspect the complete diff, and return the required completion report from AGENTS.md.
```

## Review prompt

```text
Act as a read-only reviewer for this NerdHub change.
Read AGENTS.md and relevant docs. Inspect the diff and related code.
Do not edit files.

Find concrete bugs, security issues, authorization gaps, data-integrity problems,
missing tests, accessibility issues and documentation drift.
Prioritize findings as Critical / High / Medium / Low.
For each finding provide file and line, impact, reproduction scenario and recommended fix.
If you find no issue, state the limits of your review and what you actually inspected.
```

## Security-sensitive work

Authentication, authorization, OAuth, migrations, moderation, upload handling, account deletion and XP/currency ledgers require:

- explicit human task approval,
- tests for both allowed and denied paths,
- independent review,
- documentation update,
- no production secrets or real user data in prompts.

## Avoid context drift

- Start a new agent session for a new issue when possible.
- Point agents to specific docs rather than pasting the entire product vision every time.
- Keep decisions in ADRs, not only chat history.
- Ask agents to summarize changed files and unresolved assumptions.
- Never let an agent silently change the product scope.
