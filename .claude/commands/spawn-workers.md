---
description: Run conflict-check then start workers
argument-hint: <tasks.yaml>
allowed-tools: Bash
---

Before starting workers, validate the task file for conflicts:

1. Run: `node .claude/hooks/check_task_conflicts.mjs --file $ARGUMENTS`
   (This manually invokes the conflict checker)

2. If conflicts are detected:
   - Stop and report the conflicting tasks
   - Show which files are causing conflicts
   - Suggest adding `depends_on` relationships to resolve conflicts

3. If no conflicts:
   - Run: `codex-agent start --tasks $ARGUMENTS`
   - Run: `codex-agent status` to confirm workers started

Do NOT use command chaining (&&). Run commands sequentially with error checking between each step.
