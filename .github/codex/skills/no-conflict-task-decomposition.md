---
name: no-conflict-task-decomposition
description: Ensure parallel tasks have explicit file lists and no overlaps. Only use when explicitly invoked.
---

# No-Conflict Task Decomposition

## Goal

Decompose work into parallel tasks that can run safely without file conflicts. Ensure every task declares its target files explicitly and no two parallel tasks touch the same files.

## Requirements

### 1) Every task MUST have explicit `files` array

Each task in `tasks.yaml` must declare which files it will modify:

```yaml
tasks:
  - id: task-01-api
    files: [services/api.ts, types/api.ts]
    description: Add API endpoint

  - id: task-02-ui
    files: [app/dashboard/page.tsx, components/Chart.tsx]
    description: Update dashboard UI
```

**Never:**
- Leave `files` array empty or omitted
- Use vague descriptions like "various files" or "TBD"
- Assume files will be discovered during execution

### 2) No overlapping files in parallel tasks

Two tasks can only modify the same file if they have an explicit dependency relationship:

```yaml
# ✅ GOOD: task-02 depends on task-01, so they can both touch app.tsx
tasks:
  - id: task-01-setup
    files: [app.tsx, config.ts]

  - id: task-02-extend
    files: [app.tsx, components/New.tsx]
    depends_on: [task-01-setup]

# ❌ BAD: Both tasks touch app.tsx but no dependency
tasks:
  - id: task-01-setup
    files: [app.tsx, config.ts]

  - id: task-02-extend
    files: [app.tsx, components/New.tsx]
```

### 3) Auto-generate dependencies when overlap is unavoidable

If file overlap is required, add `depends_on` to serialize the tasks:

**Before (conflict):**
```yaml
- id: task-ui-header
  files: [app/video/[id].tsx]
- id: task-ui-footer
  files: [app/video/[id].tsx]
```

**After (fixed):**
```yaml
- id: task-ui-header
  files: [app/video/[id].tsx]
- id: task-ui-footer
  files: [app/video/[id].tsx]
  depends_on: [task-ui-header]
```

## Workflow

### Phase 1: Analyze the work

1. Identify all files that need modification
2. Group changes by natural boundaries:
   - Services layer (services/*.ts)
   - UI components (app/*, components/*)
   - Types (types/*.ts)
   - Tests (*.test.ts)
3. Look for "hot files" that multiple changes might touch
   - Example: Main page files (app/video/[id].tsx)
   - Example: Central type definitions (types/index.ts)

### Phase 2: Decompose into tasks

1. Create one task per logical unit of work
2. Assign explicit file list to each task
3. If a file appears in multiple tasks:
   - Option A: Merge those tasks into one (if work is related)
   - Option B: Add `depends_on` to serialize them
   - Option C: Split the file's changes across different sections (risky)

### Phase 3: Validation checklist

Before running `codex-agent start`, verify:

- [ ] Every task has a non-empty `files` array
- [ ] No two parallel tasks share files (unless related by `depends_on`)
- [ ] Dependencies form a valid DAG (no cycles)
- [ ] File paths are relative to repo root
- [ ] All critical files are assigned to at least one task

Run the conflict checker manually:
```bash
node .claude/hooks/check_task_conflicts.mjs --file tasks.yaml
```

Or use the slash command:
```
/spawn-workers tasks.yaml
```

## Common Patterns

### Pattern 1: Layer-based decomposition

```yaml
tasks:
  - id: types
    files: [types/index.ts]

  - id: services
    files: [services/bpm.ts, services/audio.ts]
    depends_on: [types]

  - id: ui
    files: [app/video/[id].tsx, components/BPMDisplay.tsx]
    depends_on: [services]
```

### Pattern 2: Feature-based decomposition (parallel)

```yaml
tasks:
  - id: feature-a
    files: [app/featureA/page.tsx, services/featureA.ts]

  - id: feature-b
    files: [app/featureB/page.tsx, services/featureB.ts]

  # No depends_on needed - different files
```

### Pattern 3: Hotfile handling

```yaml
tasks:
  - id: ui-phase-1
    files: [app/video/[id].tsx, components/Header.tsx]

  - id: ui-phase-2
    files: [app/video/[id].tsx, components/Footer.tsx]
    depends_on: [ui-phase-1]

  # Serialize changes to app/video/[id].tsx
```

## Recovery from conflicts

If the conflict checker reports errors:

1. Read the conflict report:
   ```
   - task-01 and task-03 both touch: app/video/[id].tsx
   ```

2. Choose a resolution strategy:
   - Add `depends_on: [task-01]` to task-03
   - Merge task-01 and task-03 into one task
   - Split work to eliminate overlap

3. Update `tasks.yaml` and re-run checker

4. Only start workers after conflicts are resolved

## Anti-patterns

- Don't start workers before resolving conflicts ("we'll merge later")
- Don't use wildcard patterns in `files` array (`app/**/*.tsx`)
- Don't leave `files` empty with a TODO comment
- Don't assume Git will auto-resolve merge conflicts cleanly
