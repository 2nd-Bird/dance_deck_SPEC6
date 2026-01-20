---
description: Show codex-agent status with diffs and recent logs
allowed-tools: Bash
---

Run these commands and summarize the worker states:

1. `codex-agent status` - Shows all workers and their current state
2. For each active worker: `codex-agent diff <id> --stat` - Shows changed files
3. For each active worker: `codex-agent logs <id> -n 20` - Shows recent activity

Present the information in a clear summary format:
- Worker ID, status, branch
- Files modified (from diff --stat)
- Last few log lines indicating current activity
- Any errors or blockers observed

Do NOT run these commands in a loop or with &&. Run them sequentially with verification between each command.
