# AGENTS.md — Compatibility Stub

## Status: Superseded

This file is superseded by **CLAUDE.md** and `.claude/rules/*`.

## Operational SSOT
- **Main entry**: `CLAUDE.md` (project memory and rules)
- **Split rules**: `.claude/rules/approvals.md`, `.claude/rules/worktree-safety.md`, `.claude/rules/orchestration.md`
- **What to build**: `SPEC.md`
- **Approval docs**: `agent_docs/approvals/POLICY.md`, `APPROVAL_LOG.md`, `USERLESS_PLAN.md`

## Execution Model
This repo uses **codex-agent** orchestration:
- Multiple Codex CLI workers run in parallel (tmux + git worktrees)
- Each worker gets a task markdown (`.task-prompt.md` in worktree)
- Supervisor (Claude Code) monitors and integrates changes
- Follow instructions in your assigned task file

## Critical Rules
1. **Permissions**: Log every approval prompt, avoid for-loops/&&/pipes
2. **Worktree safety**: Never cd into `.codex-agent/worktrees/`, always use `git -C`
3. **No .gitignore hacks**: Do NOT add `.task-prompt.md` to `.gitignore` as a workaround
4. **Quality gates**: Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before committing

## When Executing a Task
- Read your `.task-prompt.md` for full instructions
- Implement only what's specified
- Run quality gates before finishing
- Do NOT edit orchestration docs (CLAUDE.md, AGENTS.md, etc.)

---

For full details, see **CLAUDE.md** and `.claude/rules/*`.
