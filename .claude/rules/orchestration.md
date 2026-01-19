# Orchestration Workflow (codex-agent)

## Overview
This project uses `codex-agent` to orchestrate multiple Codex CLI workers in parallel.
Each worker operates in its own git worktree and tmux session.

## DO NOT
- Inspect or manipulate tmux sessions directly
- Manually edit `.codex-agent/**` state files
- Use Bash for-loops to iterate over workers (triggers approval prompts)
- Run `codex-agent send` with messages containing special chars (causes bash injection)

## Core Commands

### Start Workers
```bash
codex-agent start --tasks <path-to-tasks.yaml>
```

### Monitor Progress
```bash
# Use the safe monitoring script (no for-loops):
./scripts/monitor_workers.sh

# Or individual commands:
codex-agent status
codex-agent logs <worker-id> -n 20
codex-agent diff <worker-id> --stat
```

### Send Instructions
```bash
codex-agent send <worker-id> "instruction text"
```
**Note:** Avoid special characters. If worker is stuck at bash prompt (not in Codex session), restart it manually.

### Stop Workers
```bash
codex-agent stop <worker-id>
codex-agent cleanup --force  # Removes all worktrees and state
```

## Worker Lifecycle

1. **Start** - codex-agent creates worktree, branch, tmux session, runs `codex exec < .task-prompt.md`
2. **Execute** - Worker implements task according to task markdown
3. **Monitor** - Supervisor checks logs/diffs, sends corrections if needed
4. **Complete** - Worker commits changes (or reports failure)
5. **Integrate** - Supervisor merges changes sequentially to main branch
6. **Cleanup** - Remove worktree after integration

## Task Files

Located in `.github/codex/runs/<run-id>/`
- `tasks.yaml` - Manifest defining all tasks
- `task-<id>.md` - Detailed instructions for each worker

Each worker sees `.task-prompt.md` in its worktree (copy of task markdown).
This file should be ignored via `.gitignore` or worktree exclude.

## Parallelism Rules

**Can run in parallel:**
- Tasks touching different files
- Independent analysis/research tasks

**Must run sequentially:**
- Tasks modifying the same file (e.g., two tasks both editing `app/video/[id].tsx`)
- Tasks with explicit dependencies in manifest

**Prevention:** Declare file dependencies in tasks.yaml or manually stop conflicting workers.

## Monitoring Script

`scripts/monitor_workers.sh` provides friction-free monitoring:
- Enumerates workers manually (no for-loops with `$vars`)
- Shows status, diffs, and recent logs
- Safe to run without triggering approval prompts

If iteration logic is needed, implement in `scripts/monitor_workers.mjs` (Node.js).

## Common Issues

**Issue:** Worker stuck asking about `.task-prompt.md`
**Fix:** Add to repo `.gitignore` or improve worktree exclude timing

**Issue:** `codex-agent send` messages appear as bash commands
**Fix:** Worker's tmux session exited Codex. Restart manually or fix codex-agent guard

**Issue:** Diff shows nothing despite worker creating files
**Fix:** Worker created untracked files. Check `git -C <worktree> status --porcelain`

**Issue:** Workers editing same file cause merge conflicts
**Fix:** Stop one worker, let the other complete, then integrate sequentially

## Integration Workflow

After workers complete:
1. Review diffs: `codex-agent diff <id> --stat`
2. Check quality gates in one worktree: `pnpm lint && pnpm typecheck && pnpm build`
3. If gates pass, merge changes to main branch sequentially
4. Run gates again on main
5. Commit and push
6. Cleanup worktrees

## Reference
- Tool source: `/home/second_bird/orchastrator`
- Tasks location: `.github/codex/runs/`
- Worker state: `.codex-agent/`
