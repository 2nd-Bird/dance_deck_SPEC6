# Approval Friction Log

This log tracks every permission prompt encountered during automated workflows to identify patterns and eliminate human approvals.

## Log Format

Each entry records:
- **Timestamp**: When the prompt appeared
- **PWD**: Working directory
- **Command**: The exact command shown in the prompt (verbatim)
- **Reason/Label**: Claude Code's explanation (if shown)
- **User Choice**: Yes/No/Always allow/Rejected
- **Outcome**: success/failure + error if any
- **Category**: LOOP/VARIABLES, PATH/CWD, GIT, DESTRUCTIVE, FILE_EDIT, NETWORK, UNKNOWN

---

## Entries

### 2026-01-18 22:55 UTC
- **PWD**: `/home/second_bird/dance_deck_copy`
- **Command**: `git worktree remove --force .codex-agent/worktrees/task-01-data-model && git worktree remove --force .codex-agent/worktrees/task-02-audio-extraction && git worktree remove --force .codex-agent/worktrees/task-03-bpm-analysis && git worktree remove --force .codex-agent/worktrees/task-04-tempo-normalization && git worktree remove --force .codex-agent/worktrees/task-05-beat-map-snapping && git worktree remove --force .codex-agent/worktrees/task-06-ui-integration && git worktree remove --force .codex-agent/worktrees/task-07-cache-fallback && git worktree prune`
- **Reason/Label**: Chained commands with &&
- **User Choice**: Rejected
- **Outcome**: Not executed - user requested verification first
- **Category**: GIT, LOOP/VARIABLES (chained commands)
- **Notes**: User requested checking worktrees for changes before deletion. Task-06 had 110 lines of changes which were saved to agent_docs/approvals/task-06-ui-integration.diff before any cleanup.

### 2026-01-18 23:18 UTC
- **PWD**: `/home/second_bird/dance_deck_copy`
- **Command**: `git -C /home/second_bird/dance_deck_copy status --porcelain`
- **Reason/Label**: Check git status of main repo
- **User Choice**: Rejected
- **Outcome**: Not executed - rejected during .gitignore edit
- **Category**: GIT

---
