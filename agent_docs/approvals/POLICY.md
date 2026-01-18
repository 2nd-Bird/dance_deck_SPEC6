# Approval Policy

This document defines which commands should be allowed/denied by default to enable frictionless automation while maintaining safety.

## Safe Commands (Allow by Default)

### codex-agent Operations
- `codex-agent status`
- `codex-agent logs <worker-id>`
- `codex-agent logs <worker-id> -n <number>`
- `codex-agent diff <worker-id>`
- `codex-agent diff <worker-id> --stat`
- `codex-agent send <worker-id> "<instruction>"`
- `codex-agent stop <worker-id>`
- `codex-agent cleanup --force` (when warranted)

### Git Read Operations
- `git status`
- `git status --porcelain`
- `git diff`
- `git diff --stat`
- `git log`
- `git branch`
- `git worktree list`
- `git worktree prune`
- `git -C <path> status`
- `git -C <path> diff`

### File System Read Operations
- `ls`, `ls -la`
- `cat <file>`
- `head <file>`
- `tail <file>`
- `pwd`
- `find` (read-only searches)
- `which <command>`

### Development Tools
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `npm run build`
- `npm link`
- `tsc` (TypeScript compiler)

### Safe Directory Boundaries
**Allowed for automatic read/write:**
- Repo root: `/home/second_bird/dance_deck_copy`
- `.github/codex/**` (run artifacts, logs, tasks)
- `.codex-agent/**` (worktrees, state)
- `agent_docs/**` (documentation)
- `scripts/**` (automation scripts)

## Dangerous Commands (Always Deny)

### Destructive File Operations
- `rm -rf *`
- `rm -r -f *`
- `mkfs *`
- `dd *of=/dev/*`

### Privileged Operations
- `sudo *`
- `chmod 777 *`
- `chown -R *`

### Dangerous Git Operations
- `git reset --hard`
- `git clean -fd`
- `git push --force`
- `git push -f`
- `git rebase --onto`
- `git checkout -- *` (without verification)

### Network Execution Risks
- `curl * | sh`
- `wget * | sh`
- `curl * | bash`

### Publishing
- `npm publish`
- `pnpm publish`
- `yarn publish`

## Commands Requiring Verification

### Worktree/Branch Management
- `git worktree remove` - **Verify no uncollected changes first**
- `git worktree add` - **Check if branch already exists**
- `git branch -D` - **Verify branch not in use by worktree**

### Chained Commands
- Any command with `&&` chaining - **Split into sequential single commands**
- Any command with pipes - **Evaluate safety of each component**

## Rules to Eliminate Permission Prompts

### 1. No Bash For-Loops or Variables in Single Commands
**BAD:**
```bash
for task in task-01 task-02; do codex-agent send "$task" "message"; done
```

**GOOD:**
```bash
codex-agent send task-01 "message"
codex-agent send task-02 "message"
```

### 2. No Command Chaining with &&
**BAD:**
```bash
cmd1 && cmd2 && cmd3
```

**GOOD:**
```bash
cmd1
# verify success, then:
cmd2
# verify success, then:
cmd3
```

### 3. Use Helper Scripts for Complex Iteration
If you need to enumerate workers, create a Node.js script in `scripts/` that outputs fixed commands, then execute them one by one.

### 4. Prefer Single-Purpose Commands
**BAD:**
```bash
cd dir && git status && cd -
```

**GOOD:**
```bash
git -C dir status
```

## Settings Configuration

Update `.claude/settings.local.json` with:
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
      "Bash(pnpm lint*)",
      "Bash(pnpm typecheck*)",
      "Bash(pnpm test*)",
      "Bash(pnpm build*)",
      "Bash(ls*)",
      "Bash(cat *)",
      "Bash(pwd*)",
      "Bash(which *)"
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

---

**Goal**: Zero human approvals for routine orchestration workflows while maintaining safety boundaries.
