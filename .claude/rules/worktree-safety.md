# Worktree Safety Rules

## Critical: Prevent Bash Shell Corruption

### The Problem
If Bash's current working directory (CWD) is deleted while the shell is sitting in it, the shell enters a broken state where **all commands fail** (even `pwd`, `echo`, `cd /`).

This happens when:
1. Shell's CWD is `.codex-agent/worktrees/task-01`
2. That worktree is deleted (via `git worktree remove` or cleanup script)
3. Shell is now in a deleted directory → broken state

### Prevention Rules

**NEVER:**
- Run cleanup/removal commands while `pwd` is inside `.codex-agent/worktrees/**`
- Run `git worktree remove` or `codex-agent cleanup` without first confirming repo root
- Use `cd .codex-agent/worktrees/<task>` for any reason

**ALWAYS:**
1. Before cleanup: `cd <repo-root>` then confirm with `pwd`
2. Use `git -C <worktree-path>` instead of `cd <worktree> && git ...`
3. Operate from stable directories (repo root or home)

**Recovery (if getcwd errors occur):**
```bash
env -i HOME=$HOME bash -c "cd <repo-root> && <command>"
```

### Safe Patterns

❌ Unsafe:
```bash
cd .codex-agent/worktrees/task-01
git status
cd ../..
git worktree remove .codex-agent/worktrees/task-01  # CWD might still be there!
```

✅ Safe:
```bash
git -C .codex-agent/worktrees/task-01 status
# Later, from repo root:
pwd  # Verify: /home/second_bird/dance_deck_copy
git worktree remove --force .codex-agent/worktrees/task-01
```

### Worktree Operations

**Before removing worktrees:**
1. Verify uncommitted changes: `git -C <worktree> status --porcelain`
2. Save diffs if needed: `git -C <worktree> diff > backup.diff`
3. Only then: `git worktree remove --force <worktree>`

**Sequential, not chained:**
```bash
# ❌ Bad (triggers approval + no error handling)
git worktree remove w1 && git worktree remove w2

# ✅ Good
git worktree remove --force w1
# Verify success, then:
git worktree remove --force w2
```

### Directory Boundaries
**Safe to operate in:**
- Repo root: `/home/second_bird/dance_deck_copy`
- Home directory
- Temp directories outside worktrees

**NEVER operate from:**
- `.codex-agent/worktrees/**` (ephemeral, can be deleted)
- Any subdirectory that might be removed during workflow

### Enforcement
Hook: `.claude/hooks/prevent_cwd_delete.mjs` (denies cd into worktrees during cleanup operations)
