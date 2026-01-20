# SKILLS.md — Codex Skills Index

This repo stores Codex skills as standalone markdown files under:

- `.github/codex/skills/*.md`

## How to invoke a skill (explicit only)

When you want Codex to use a skill, include one of these in your run prompt or TODO item:

- `SKILL: ask-questions-if-underspecified`
- `Use skill: ask-questions-if-underspecified`

Codex must NOT apply skills automatically unless explicitly invoked.

## Available skills

- `ask-questions-if-underspecified`
  - File: `.github/codex/skills/ask-questions-if-underspecified.md`
  - Purpose: clarify requirements before implementing

- `no-conflict-task-decomposition`
  - File: `.github/codex/skills/no-conflict-task-decomposition.md`
  - Purpose: ensure parallel tasks have explicit file lists and no overlaps

## Notes for long-run mode

Long runs must keep moving. If a requirement is unclear and the skill is NOT invoked:
- document assumptions briefly in run notes
- add TODO entries using `NEEDS-DECISION` / `HUMAN-BLOCKED` / `HUMAN-VERIFY`
- continue with other actionable items
