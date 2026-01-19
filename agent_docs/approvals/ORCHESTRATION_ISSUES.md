# Orchestration Issues (codex-agent Enhancements Needed)

These are issues identified during the Dance Deck Addendum 6 implementation that require fixes to codex-agent itself.

## Issue 1: codex-agent send Not Reaching Codex Session

**Problem**: When a worker encounters an issue and pauses, `codex-agent send <id> "message"` types the message into the tmux pane's bash prompt instead of sending it to the Codex session.

**Root Cause**: The tmux pane is not in an active Codex session - either it never started, crashed, or exited.

**Current Behavior**:
```bash
$ codex-agent send task-01-data-model "Ignore the file and continue"
# Result in tmux pane:
second_bird@host:~/worktree$ Ignore the file and continue
Ignore: command not found
```

**Desired Behavior**:
1. Before sending, detect if pane is in active Codex session (check for codex prompt)
2. If not, restart the session: `codex exec --sandbox workspace-write < .task-prompt.md`
3. Then send the instruction

**Implementation**:
- In `src/core/WorkerManager.ts` `sendInstruction()` method
- Capture last 5 lines from tmux pane with `tmux capture-pane -p -t <pane>`
- Check for patterns like `codex>`, `second_bird@` (bash prompt), or `$` (shell prompt)
- If not in Codex session, re-run the exec command, wait for prompt, then send

## Issue 2: diff --stat Doesn't Show Untracked Files

**Problem**: `codex-agent diff <id> --stat` only shows staged/modified files, not untracked files that workers created.

**Current Behavior**:
```bash
$ codex-agent diff task-02-audio-extraction --stat
# Shows nothing even though services/audioExtraction.ts was created (untracked)
```

**Desired Behavior**:
Include untracked files in the output:
```
Untracked files:
  services/audioExtraction.ts

No staged/modified changes
```

**Implementation**:
- In `src/commands/diff.ts`
- After running `git diff --stat`, also run `git status --porcelain`
- Parse output for `??` (untracked) lines
- Append to diff output

## Issue 3: .task-prompt.md Causes Worker Pauses

**Problem**: Workers see `.task-prompt.md` as an unexpected untracked file and pause to ask what to do with it.

**Current Behavior**:
- codex-agent writes `.task-prompt.md` to worktree
- Codex sees it via `git status --porcelain`
- Codex follows "stop and ask" protocol for unexpected files

**Attempted Fix**:
- Tried adding to `.git/worktrees/<name>/info/exclude` but workers still see it
- Adding to `.gitignore` works but pollutes diffs across all workers

**Desired Behavior**:
- `.task-prompt.md` is excluded from git status BEFORE codex exec runs
- Workers never see it as an untracked file

**Implementation Options**:

**Option A**: Add to repo-level `.gitignore`
- ✅ Works immediately
- ❌ Shows up in diffs when workers commit
- Current status: Added but need to test

**Option B**: Use `.git/info/exclude` in main repo
- ✅ Doesn't pollute diffs
- ❌ Doesn't propagate to worktrees (worktrees have separate .git)
- Status: Doesn't work for worktrees

**Option C**: Add to worktree exclude BEFORE creating .task-prompt.md
- In `WorkerManager.ts`, before writing task file:
  ```typescript
  const excludePath = path.join(this.repoRoot, '.git', 'worktrees', task.id, 'info', 'exclude');
  fs.appendFileSync(excludePath, '\n.task-prompt.md\n');
  ```
- Then write `.task-prompt.md`
- Then run `codex exec`
- Status: Implemented but workers still seeing file

**Option D**: Pass task via stdin without writing file
- Already doing this: `codex exec < .task-prompt.md`
- But file must exist for stdin redirection
- Status: Current approach

**Recommended Fix**: Investigate why worktree exclude isn't working. May need to verify:
- Exclude file path is correct for worktrees
- Exclude file is created/appended before codex starts
- Codex respects git exclude files

## Issue 4: Parallel Tasks Editing Same File

**Problem**: Tasks 05 (beat-map-snapping) and 06 (ui-integration) both modify `app/video/[id].tsx` simultaneously, causing merge conflicts during integration.

**Root Cause**: Task manifest allows parallel execution of tasks that touch the same file.

**Current Mitigation**: Stopped task-06 manually to let task-05 complete first.

**Desired Behavior**:
- Task manifest should declare file dependencies
- codex-agent should detect conflicts and run conflicting tasks sequentially

**Implementation**:
- Add `files` field to task manifest:
  ```yaml
  tasks:
    - id: task-05-beat-map-snapping
      file: task-05-beat-map-snapping.md
      files: ["app/video/[id].tsx"]
    - id: task-06-ui-integration
      file: task-06-ui-integration.md
      files: ["app/video/[id].tsx"]
      depends_on: [task-05-beat-map-snapping]  # Auto-generated based on file conflict
  ```
- During task planning, detect file overlaps and add dependency edges

---

**Priority**:
1. Issue 1 (send guard) - HIGH - Blocks worker recovery
2. Issue 3 (task-prompt.md) - HIGH - Causes frequent pauses
3. Issue 2 (diff untracked) - MEDIUM - UX improvement
4. Issue 4 (parallel conflicts) - MEDIUM - Planning/manifest issue

**Next Steps**:
1. Fix Issues 1 and 3 in orchestrator repo
2. Test with current worker set
3. Document in orchestrator CHANGELOG
