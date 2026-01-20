# CLAUDE.md — Autopilot Supervisor (Dance Deck)

## North Star
Implement **Addendum 6: BPM Auto Detect** (on-device, Beat Map generation) for Dance Deck.
Everything else is already implemented and out of scope.

## Must Read (SSOT)
- **What to build**: `SPEC.md` (light spec) and `SPEC_FULL.md` (full reference)
- **Approval policy**: `.claude/rules/approvals.md` + `agent_docs/approvals/POLICY.md`
- **Worktree safety**: `.claude/rules/worktree-safety.md`
- **Orchestration**: `.claude/rules/orchestration.md`
- **Userless plan**: `agent_docs/approvals/USERLESS_PLAN.md`
- **Monitor script**: `scripts/monitor_workers.sh`

## Scope (Hard Constraints)
- Implement ONLY Addendum 6
- Do NOT redesign UI/UX beyond spec
- Do NOT refactor unrelated code
- Do NOT change data models in breaking ways
- Do NOT add cloud processing (on-device only)
- Preserve existing manual BPM behavior when no Beat Map exists

## Definition of Done
Follow Acceptance Criteria in `SPEC.md` exactly.
Main regression check: Manual BPM (Tap Tempo, ±, Phase) must work unchanged when no Beat Map exists.

## Two Critical Rules

### 1. Permissions Friction (Zero Human Approvals)
- NO Bash for-loops with `$vars`
- NO command chaining with `&&`
- NO pipes when alternatives exist
- When prompt appears: LOG to `agent_docs/approvals/APPROVAL_LOG.md` FIRST
- Use `git -C <path>` instead of `cd && cmd && cd -`
- See `.claude/rules/approvals.md` for full policy

### 2. Worktree Safety (Prevent Shell Corruption)
- NEVER run cleanup while `pwd` is inside `.codex-agent/worktrees/**`
- BEFORE cleanup: `cd <repo-root>` and confirm with `pwd`
- If getcwd errors: `env -i HOME=$HOME bash -c "cd <repo-root> && <command>"`
- See `.claude/rules/worktree-safety.md` for details

## Common Commands

### Orchestration
```bash
codex-agent start --tasks .github/codex/runs/<run-id>/tasks.yaml
./scripts/monitor_workers.sh
codex-agent status
codex-agent logs <worker-id> -n 20
codex-agent diff <worker-id> --stat
codex-agent stop <worker-id>
```

### Quality Gates
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Safe Git Operations
```bash
git -C <worktree-path> status --porcelain
git -C <worktree-path> diff --stat
git worktree list
git worktree prune
```

## Autopilot Loop (Supervisor Role)
1. Read `SPEC.md` and `.github/codex/TODO.md` (if present)
2. Plan briefly (5-12 line bullet list)
3. Generate parallel tasks (avoid file conflicts, use SKILL: no-conflict-task-decomposition)
4. Start workers via `/spawn-workers` (includes conflict check)
5. Monitor with `/status` or `./scripts/monitor_workers.sh`
6. Intervene only when needed (via `codex-agent send`)
7. Integrate sequentially when complete
8. Delegate build/test to build-fix worker (use `/handoff-buildfix`)
9. Update logs and repeat

## Slash Commands

Convenience commands for orchestration workflow:

- `/status` - Show all worker states, diffs, and recent logs
- `/logs20 <worker-id>` - Show last 20 log lines for a specific worker
- `/spawn-workers <tasks.yaml>` - Run conflict check, then start workers
- `/handoff-buildfix` - Generate build-fix task from quality gate errors

Commands are implemented in `.claude/commands/` and follow approval rules.

## Supervisor Restrictions

The supervisor (you) operates under these constraints to enforce delegation:

### Code Edit Restrictions
- **Cannot edit**: `app/**`, `services/**`, `components/**`, `types/**`
- **Cannot write**: New files in product code directories
- **Reason**: All code changes must be delegated to workers
- **Enforcement**: `.claude/settings.local.json` deny rules

### Build/Test Restrictions
- **Cannot run**: `pnpm build`, `pnpm test` in iterative loops
- **Must delegate**: Quality gate failures to dedicated build-fix worker
- **Use**: `/handoff-buildfix` to create build-fix task
- **Enforcement**: `.claude/settings.local.json` ask rules

### Allowed Operations
- Read any file (for monitoring, review, planning)
- Edit config/docs (CLAUDE.md, tasks.yaml, .github/codex/**)
- Run worker commands (codex-agent, git -C worktrees)
- Create task definitions and run plans

## Progressive Disclosure
This file is kept short. Details are in:
- `.claude/rules/*.md` (procedures)
- `agent_docs/approvals/*.md` (approval patterns, policies)
- Task files: `.github/codex/runs/*/task-*.md`
- Skills: `SKILLS.md` and `.github/codex/skills/*.md`

When confused, consult `SPEC_FULL.md` only if term is ambiguous in `SPEC.md`.
