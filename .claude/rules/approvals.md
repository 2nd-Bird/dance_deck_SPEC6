# Approval & Permission Rules

## Core Principle
Every permission prompt must be logged. Goal: Zero human approvals for routine operations.

## When Permission Prompt Appears
1. **Log it FIRST** - Append entry to `agent_docs/approvals/APPROVAL_LOG.md`
2. Check if command is in allow/deny list
3. Proceed or refactor command

## Command Patterns That Trigger Prompts
**AVOID these patterns:**
- Bash for-loops with variables: `for x in ...; do cmd $x; done`
- Command chaining with `&&`: `cmd1 && cmd2 && cmd3`
- Pipes when alternatives exist: `cat file | grep pattern`
- Variable expansion in commands: `codex-agent send $task "msg"`

**USE instead:**
- Sequential single commands with verification between
- Fixed enumeration (no variables)
- Helper scripts in `scripts/` for complex iteration
- Direct tool calls (Read, Grep, Glob) instead of cat/grep/find

## Allow/Deny Policy
See `agent_docs/approvals/POLICY.md` for comprehensive lists.

**Always Safe (auto-approve):**
- `codex-agent status/logs/diff`
- `git status`, `git diff`, `git log` (read-only)
- `git -C <path> status` (preferred over cd)
- `pnpm lint/typecheck/test/build`
- File reads: `ls`, `cat`, `pwd`

**Always Deny (auto-reject):**
- `rm -rf *`, `sudo *`
- `git reset --hard`, `git push --force`
- `npm publish`, `curl * | sh`

**Verify First (manual approval):**
- `git worktree remove --force` (check for uncommitted changes)
- `git branch -D` (verify not in use)
- Critical file edits (CLAUDE.md, SPEC.md)

## Refactoring Examples
❌ `for task in t1 t2; do codex-agent logs $task; done`
✅ `codex-agent logs t1` then `codex-agent logs t2`

❌ `cd dir && git status && cd -`
✅ `git -C dir status`

❌ `git worktree remove w1 && git worktree remove w2`
✅ `git worktree remove w1`, verify, then `git worktree remove w2`

## Enforcement
- Hook: `.claude/hooks/log_permission_request.mjs` (auto-logs every prompt)
- See `agent_docs/approvals/USERLESS_PLAN.md` for patterns and fixes
