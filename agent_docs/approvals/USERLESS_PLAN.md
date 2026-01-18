# Userless Automation Plan

Goal: Eliminate all human approval prompts from the orchestration workflow.

## Top 5 Recurring Approval Patterns

### 1. Chained Commands with `&&`
**Pattern**: `cmd1 && cmd2 && cmd3`
**Why it triggers**: Multiple commands chained together
**Fix**: Split into sequential single commands with verification between each
**Status**: Rule added to Claude.md

### 2. Bash For-Loops with Variables
**Pattern**: `for x in ...; do cmd $x; done`
**Why it triggers**: Variable expansion and loop constructs
**Fix**: Use sequential fixed commands OR implement iteration in Node.js script
**Status**: Rule added to Claude.md, monitor_workers.sh created

### 3. Git Operations with `-C` Flag
**Pattern**: `git -C <path> status --porcelain`
**Why it triggers**: Path specification can be seen as risky
**Fix**: Add to settings.local.json allowlist with pattern
**Status**: Documented in POLICY.md, needs settings update

### 4. Working in Deleted Directories
**Pattern**: Any command when `pwd` is in deleted `.codex-agent/worktrees/**`
**Why it triggers**: Shell CWD becomes invalid, all commands fail
**Fix**: Always `cd <repo-root>` before cleanup operations
**Status**: Rule added to Claude.md (Bash Session Safety)

### 5. codex-agent send with Special Characters
**Pattern**: `codex-agent send <id> "message with (parens) or quotes"`
**Why it triggers**: Shell escaping issues in tmux send-keys
**Fix**: Detect if worker is in Codex session before sending; restart session if needed
**Status**: Needs codex-agent enhancement

## Exact Fixes Implemented

### Settings Allowlist (Planned)
Update `.claude/settings.local.json`:
```json
{
  "permissions": {
    "allow": [
      "Bash(codex-agent *)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git -C * status*)",
      "Bash(git -C * diff*)",
      "Bash(git worktree list*)",
      "Bash(git worktree prune*)",
      "Bash(pnpm *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(pwd*)",
      "Bash(which *)",
      "Bash(chmod +x scripts/*)"
    ],
    "deny": [
      "Bash(rm -rf*)",
      "Bash(sudo*)",
      "Bash(git reset --hard*)",
      "Bash(git push --force*)",
      "Bash(*publish*)"
    ]
  }
}
```

### Helper Scripts
- `scripts/monitor_workers.sh` - Fixed iteration without for-loops
- `scripts/cleanup_and_restart.sh` - Safe worktree cleanup

### Command Refactoring
- ❌ `git worktree remove --force w1 && git worktree remove --force w2 && ...`
- ✅ Sequential: `git worktree remove --force w1`, then `git worktree remove --force w2`, etc.

- ❌ `cd dir && git status && cd -`
- ✅ `git -C dir status`

- ❌ `for task in t1 t2; do codex-agent send $task "msg"; done`
- ✅ `codex-agent send t1 "msg"`, then `codex-agent send t2 "msg"`

## Remaining Prompts That Cannot Be Eliminated

### 1. Destructive Git Operations
**Pattern**: `git worktree remove --force`, `git branch -D`
**Why keep**: Prevents accidental data loss
**Mitigation**: Always verify no uncommitted changes first via `git -C <worktree> status --porcelain`

### 2. File Edits in Critical Paths
**Pattern**: Editing `Claude.md`, `SPEC.md`, core config files
**Why keep**: Prevents accidental corruption of guidance documents
**Mitigation**: Only edit when explicitly instructed by user

### 3. Network Operations
**Pattern**: `curl`, `wget`, `npm publish`
**Why keep**: Prevents unintended external interactions
**Mitigation**: These should remain human-approved

## Process

When an approval prompt appears:
1. **Log it first** - Append entry to APPROVAL_LOG.md with timestamp, command, category
2. **Analyze pattern** - Is it recurring? Can it be eliminated?
3. **Update this doc** - Add pattern if new, update fix status if addressed
4. **Implement fix** - Add to allowlist, refactor command, or document as intentional

## Metrics

Target: <5% of orchestration commands require approval
Current: Unknown (needs baseline measurement)
Track: Approvals per session, recurring patterns, fix effectiveness

---

Last updated: 2026-01-18
