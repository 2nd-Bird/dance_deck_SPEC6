# CLAUDE.md (Autopilot Supervisor for Addendum 6)
> Lightweight onboarding + behavior rules for Claude Code. Keep this file short and evolve it over time.

## Why / What
This repo exists to implement **Addendum 6: BPM Auto Detect (On-device estimation from local video + Beat Map)** for Dance Deck.
Everything else is already implemented and out of scope.

**Source of truth**
- **WHAT to build (light):** `SPEC.md`
- **Full reference only if needed:** `SPEC_FULL.md`

## Scope (Hard Constraints)
- Implement **only Addendum 6** and integrate it into the existing codebase **without breaking existing behavior**.
- Do **not** redesign UI/UX beyond Addendum 6 requirements.
- Do **not** refactor unrelated code.
- Do **not** change data models in a breaking way.
- Do **not** add cloud processing. Analysis must be fully on-device.

## Definition of Done
Follow the Acceptance Criteria in `SPEC.md` exactly.
Main non-regression expectations:
- Manual BPM (Tap Tempo / ±), Phase (“This is 1”), and existing loop behavior must remain unchanged when **no Beat Map** exists.
- Beat Map snapping is an additive upgrade only when Beat Map exists.

## Codex Orchestration Tool

This project uses `codex-agent` to orchestrate multiple Codex workers in parallel.

### How to use codex-agent (DO NOT use tmux directly)
- Start workers:
  `codex-agent start --tasks <tasks.yaml>`

- Check progress:
  `codex-agent status`
  `codex-agent logs <worker-id>`
  `codex-agent diff <worker-id> --stat`

- Send additional instructions:
  `codex-agent send <worker-id> "<instruction>"`

- Stop or cleanup (destructive, use with care):
  `codex-agent stop <worker-id>`
  `codex-agent cleanup --force`

### Important rules
- Do NOT inspect tmux sessions directly.
- Do NOT manipulate `.codex-agent/**` manually.
- Interact with workers ONLY via `codex-agent` commands.
- Each worker operates in its own git worktree and branch.
- AVOID Bash for-loops/variables/pipes (trigger permission prompts). Use fixed codex-agent commands per worker instead (status, diff, logs, send).

## How We Work (Autopilot Loop)
You are the **Supervisor**. Your job is to keep progress moving with minimal human involvement.

### Default Loop
1) **Read** `SPEC.md` and scan `.github/codex/TODO.md` (if present) for current queue.
2) **Plan briefly** (bullet list, 5–12 lines). Keep it concrete: tasks + owners + success checks.
3) **Decompose into parallel tasks** that do not conflict on the same files.
4) **Generate task files automatically** (tasks manifest + task markdowns) under a run folder, then launch workers via `codex-agent`.
5) **Monitor** workers using `codex-agent status/logs/diff`.
6) **Intervene** only when needed using `codex-agent send` (short, specific instructions).
7) **Integrate** via a dedicated Integrator worker (single-writer policy below).
8) **Run quality gates** and update logs, then repeat until `SPEC.md` is satisfied.

### Important: “Do not stop”
- Do not stop just because a worker stopped or failed.
- If a task fails: capture logs, add a fix-task, and rerun.
- If a task is blocked by human-only inputs (keys/2FA/device): mark it as **HUMAN-BLOCKED** and move to the next actionable task.

## Single-writer Policy (Critical for Parallelism)
To avoid merge conflicts and broken run artifacts:

**Only the Codex worker may modify:**
- `.github/codex/TODO.md`
- `.github/codex/runs/**` (run logs, indexes, artifacts)
- any “global” planning docs created by automation

All other workers:
- must limit changes to scoped implementation files only
- must NOT touch TODO/run logs

## Task Design Rules (Keep Workers Reliable)
- 1 worker = 1 responsibility.
- Prefer tasks that touch **1–3 files**.
- Avoid multiple workers editing the same file. If unavoidable, run sequentially.
- Every task file must include:
  - goal
  - files to modify
  - acceptance criteria
  - commands to run

## Stop-hook Assumption
This repo assumes you may have a Stop-hook that blocks stopping while actionable tasks remain.
Behave accordingly:
- Always keep at least one next action in motion (new task generation, integration, or verification).
- When unsure, choose the smallest safe step that increases certainty (e.g., “discovery task” to locate integration points).

## Quality Gates (Always run before integrating)
Use the project’s correct commands. If unknown, discover them once and document here.

Default gates (adjust if repo differs):
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Progressive Disclosure
Keep this file short. Put details elsewhere and link them.
If you find a repeated confusion point, add a short rule here (1–3 lines max).

## Safety / Non-regression Strategy
- Prefer additive changes.
- If you need to change existing snapping or loop logic:
  - preserve legacy behavior when Beat Map is absent
  - add Beat Map path guarded by a clear condition (`if beatMap exists`)
- Add tests around:
  - tempo normalization (80–130 prior)
  - snapping correctness (with/without Beat Map)
  - fallback behavior on analysis failure

## When You Need SPEC_FULL.md
Only consult `SPEC_FULL.md` when:
- a term or behavior is ambiguous in `SPEC.md`
- a regression risk requires confirming original intent
Otherwise, stay within `SPEC.md` scope.

---
