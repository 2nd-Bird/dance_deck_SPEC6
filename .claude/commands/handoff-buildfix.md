---
description: Create instruction for build-fix worker to handle quality gate failures
allowed-tools: Bash
---

Generate a build-fix task by:

1. Run: `pnpm typecheck 2>&1 | head -50`
   Capture TypeScript errors

2. Run: `pnpm lint 2>&1 | head -50`
   Capture ESLint errors

3. Extract the first 20 lines of each error type and identify:
   - File paths with errors
   - Error types (type errors, lint violations)
   - Common patterns (if multiple similar errors)

4. Generate a minimal instruction for a build-fix worker:
   ```
   Fix the following errors:

   Type errors:
   - [file:line] error description

   Lint errors:
   - [file:line] error description

   Run quality gates after fixes: pnpm typecheck && pnpm lint && pnpm build
   ```

5. Optionally send to worker: `codex-agent send <worker-id> "instruction"`

Do NOT run commands in loops or with &&. Run sequentially.
