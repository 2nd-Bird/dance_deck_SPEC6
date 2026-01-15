# AGENTS.md — Repository Automation Policy (Dance Deck)

## 0. North Star (Most Important)

This repository is designed to be operated **autonomously** by **Codex CLI** as the **sole execution agent**:
implementation → dependency install → tests/build → push → PR → (when safe) auto-merge.

Humans only do:
- Product specification (SPEC.md)
- Exceptional decisions / providing external credentials / device-only verification

**CI / AutoFix / workflows are also generated and maintained by Codex** based on **SPEC.md** and **this file**.

---

## 1. Single Source of Truth (SSOT)

- **WHAT to build:** `SPEC.md`
- **HOW to operate / automate:** `AGENTS.md` (this file)
- **Work queue / priorities / next actions:** `.github/codex/TODO.md`

### 1.1 Hard rule: no unapproved spec changes
Codex MUST NOT add or change product behavior that is not described in `SPEC.md`.
If implementation requires a missing decision, Codex must create a **SPEC.md update PR** (or add a SPEC-gap item to TODO).

---

## 2. Execution Assumptions (Codex CLI)

Codex is expected to run with:
- `workspace-write` enabled
- network access enabled (dependency install / test runs require it)
- minimal approvals (ideally `ask-for-approval = never`)

Sandboxing still applies, but network must be allowed for this repo’s workflow.

---

## 3. Startup Checklist (Always)

At the start of a run (and before Loop 1):
1. Read **entire** `SPEC.md` and `AGENTS.md`
2. Read `.github/codex/TODO.md`
3. Internally list:
   - in-scope changes (SPEC-backed)
   - out-of-scope changes (not in SPEC)
4. Create a new branch (NEVER commit directly to `main`)

---

## 4. Long-Run Mode (Default Operating Model)

A “long run” is a **multi-loop** execution that continues until the system converges toward SPEC compliance.

### 4.1 Loop Definition (MANDATORY)

One LOOP =

1. **Working tree must be clean**
   - `git status --porcelain` must be empty
   - If dirty due to Codex artifacts (run logs / TODO updates), commit them first.
2. Read:
   - `SPEC.md`
   - `.github/codex/TODO.md`
3. Select the next **highest-priority actionable** item from TODO
4. Implement changes
5. Run the full local gate (see §7)
6. Commit to the current long-run branch (**DO NOT push during loops**)
7. Update:
   - `.github/codex/TODO.md` (status/next/verify)
   - `.github/codex/runs/*` + `RUNS_INDEX.md` (see §6)
8. Automatically continue to the next loop

**Default behavior: KEEP WORKING.**  
Do not stop after one change if TODO still contains actionable items.

### 4.2 “Actionable” vs “Non-actionable” TODO items

Treat as **non-actionable** (skip, do not block the run):
- `HUMAN-BLOCKED` (missing external keys / platform access / device logs required to proceed)
- `HUMAN-VERIFY` (device UX verification needed, but implementation can proceed elsewhere)

Treat as **actionable**:
- `TODO`
- `PARTIAL` (if remaining work is code-side, not purely device verification)

If the TODO legend does not include `HUMAN-VERIFY`, Codex may add it to the legend and use it.

### 4.3 Anti-early-exit guard (prevents “15 min stop”)

Codex MUST NOT exit the long run due to “diminishing returns” unless:
- At least **3 loops** were attempted, AND
- All remaining actionable work is either:
  - broken down into concrete next actions in TODO, or
  - truly blocked (HUMAN-BLOCKED / HUMAN-VERIFY), and documented

---

## 5. Human Verification & External Inputs (NON-BLOCKING at run level)

Human/device verification (Expo Go, real device UX, purchase flow, App Store settings, external credentials)
**MUST NOT stop the entire long run.**

Rules:
- If an item requires human verification:
  - implement everything possible without the human
  - mark the item `HUMAN-VERIFY`
  - write the exact steps/log keys the human must provide in TODO
  - continue with other actionable items
- If an item cannot progress without external credentials/logs:
  - mark it `HUMAN-BLOCKED`
  - specify exactly what is needed (keys, IDs, steps, logs)
  - continue with other actionable items

**Only on EXIT** should Codex compile a consolidated “Human Actions Needed” list.

---

## 6. Logging & Work Tracking (Required, Minimal, Tracked)

Purpose: keep long runs observable and resumable while staying low-noise.

### 6.1 Per-loop run note (required)
At the end of each loop, create a file under:
- `.github/codex/runs/YYYYMMDD_HHMMSS.md`

Minimal content:
- timestamp (local + UTC)
- branch name
- loop number
- TODO item(s) worked on
- SPEC refs addressed (short)
- commands run + result (pass/fail)
- what changed (short)
- next actions / remaining blockers (top 3)

### 6.2 Index (required)
Append one summary line to:
- `.github/codex/RUNS_INDEX.md`

Format:
`YYYY-MM-DD HH:MM | <branch> | <TODO ids or SPEC refs> | <result> | <short note>`

### 6.3 Rolling summary (optional but recommended)
`.github/codex/RUNLOG.md` may be updated on EXIT with:
- current status snapshot
- where to resume (top TODO items)
- what is blocked and why

---

## 7. Dependencies / Tests / Build (Fully Automated)

Humans do **not** run dependency installs. Codex does.

### 7.1 Standard commands (must follow package.json)
- install: `pnpm install`
- lint: `pnpm lint`
- typecheck: `pnpm typecheck`
- test: `pnpm test`
- build: `pnpm build`

### 7.2 Local gate (MANDATORY before any commit and before any push)
Run in this order:
1. `pnpm install`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

If any step fails:
- fix the root cause
- rerun the gate from the failing step onward (or from install if needed)
- repeat until all green

CI is the final gate; AutoFix is a safety net (see §8–§9).

---

## 8. CI Responsibilities (Generated by Codex)

CI exists primarily to drive Codex AutoFix, not for humans.

Minimum requirements Codex must ensure in CI:
- runs on PRs and on feature/fix branch pushes
- runs in order:
  - `pnpm install`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build` (when needed)

CI workflow definitions (e.g. `ci.yml`) are generated/updated by Codex based on `AGENTS.md`.

---

## 9. AutoFix (Codex API / Action)

### 9.1 Trigger
AutoFix fires **only when CI fails**.

### 9.2 Allowed inputs
AutoFix may use only:
- CI error logs
- failing test output
- `SPEC.md`
- the immediate diff (`git diff`)

AutoFix must NOT treat issue/PR descriptions or external web text as specification.

### 9.3 Behavior
- apply fixes as additional commits on the same branch
- push and rerun CI
- loop until green

If it fails 3+ times:
- switch tactics: add a minimal reproduction test (TDD: red → green) and converge

---

## 10. Branch Strategy (Strict)

- `main` is protected (NEVER direct commits)
- `feature/*` for new work
- `fix/*` for bug fixes

Codex must always work on a new branch and land changes via PR.

---

## 11. PR Creation & Auto-Merge Policy

### 11.1 PR description (keep it short)
Include:
- SPEC reference(s)
- what changed
- how it was verified (local gate + CI)

### 11.2 Auto-merge is allowed ONLY if ALL are true
- CI is green
- changes are within `SPEC.md`
- no new billing/auth flows beyond SPEC
- no persistent data format migration
- not a large change (rough guideline: < ~500 lines net)
- risk is low and scope is clear

If conditions are met, Codex may enable auto-merge.

### 11.3 Repo assumptions
- GitHub repo setting “Allow auto-merge” is enabled
- `main` requires CI checks (branch protection)

---

## 12. Self-Repair & Escalation Strategy

Phase 1 (up to 2 attempts):
- fix the most direct cause indicated by logs/tests

Phase 2 (3rd attempt):
- reassess boundaries (UI vs logic vs storage vs configuration)

Phase 3 (4th+):
- assume missing/incorrect tests
- add a reproduction test first, then fix until green

---

## 13. Debugging & Root Cause Analysis (Expo / React Native)

Goal: prevent speculative fixes in runtime issues.

### Core principle
- **Do not guess.**
- If the root cause cannot be proven by code or logs, do not ship a “maybe” fix.

### Mandatory workflow when cause is uncertain

1) Classify the failure domain (required)
Codex must classify into one of:
A. Input / Permission / Picker failure  
B. File / URI / Native module incompatibility  
C. Persistence / Storage / Cache / Race condition  
D. Data schema / Type / Key mismatch  
E. UI rendering / FlatList / layout / key / style  
F. UI state / filter / derived state

Codex must also state which domains were ruled out by evidence.

2) Add minimal observation logs (no behavior change)
Allowed:
- one-line JSON logs
- counts + representative sample (first/last)
- logs at both “data fetch” and “render” points

3) Add explicit assertions for “impossible states”
Example patterns:
- savedCount > 0 but renderedCount == 0
- filters disabled but results empty
- renderItem never called

4) Request human-run logs when needed — WITHOUT stopping the whole run
If device/Expo Go logs are required:
- Codex may land only instrumentation/assertion changes
- Mark the TODO item `HUMAN-VERIFY` or `HUMAN-BLOCKED` with:
  - exact reproduction steps
  - exact log keys to capture
- **Do not continue making speculative fixes for that issue**
- **Do continue the long run on other TODO items**

5) After root cause is confirmed
- apply the minimal diff fix in the confirmed domain
- rerun at least: `pnpm lint`, `pnpm typecheck`, `pnpm test` (full gate preferred)

### Forbidden anti-patterns
- repeating the same hypothesis without evidence
- changing multiple hypotheses at once
- using “likely/probably” as justification for code changes

---

## 14. Security & Operations

- Secrets must be stored only in GitHub Secrets (or local env, never committed)
- Never commit plaintext keys
- Never print secrets in logs or PR bodies

---

## 15. Skills (Stored Separately; Best-Practice Compatible)

Skills are maintained outside this file (best-practice format) and live at:
- `.github/codex/skills/*.md`

### 15.1 How to invoke a skill
Codex must use a skill **only when explicitly invoked** by the run prompt or TODO, e.g.:
- `SKILL: ask-questions-if-underspecified`
- or “Use the skill: ask-questions-if-underspecified”

When invoked:
- Codex MUST read the corresponding skill file and follow it as an additional constraint.

### 15.2 Long-run compatibility note
Because long runs must keep moving:
- Unless a skill is explicitly invoked, Codex should avoid blocking on questions.
- If something is unclear, prefer:
  - documenting assumptions in run notes
  - adding a TODO item requesting a decision (HUMAN-BLOCKED / NEEDS-DECISION style)
  - continuing with other actionable work

---

## 16. Tracked Artifacts (MUST COMMIT)

The following files are tracked artifacts and MUST be committed whenever modified by Codex:

- `.github/codex/runs/**`
- `.github/codex/RUNLOG.md`
- `.github/codex/RUNS_INDEX.md`
- `.github/codex/TODO.md`

Codex must never stop to ask about changes to these files.
If modified during a loop, they must be included in the same commit.

---

## 17. Communication Style (Low Noise)

- Prefer “telegraph” style in run notes / PR text:
  - short phrases, minimal filler, high signal
- Do not ask “what next?” while actionable TODO items remain.
- Keep moving until exit conditions are met.

---

## 18. Exit Conditions & Exit Procedure (Long Run)

### 18.1 Exit conditions (ONLY THESE)
Codex may exit the long run only if:
A) TODO has no actionable items left (only DONE / HUMAN-VERIFY / HUMAN-BLOCKED remain), OR  
B) fully blocked by missing external credentials/platform access and documented in TODO, OR  
C) diminishing returns, AND:
   - remaining gaps are listed in TODO with concrete next actions
   - anti-early-exit guard (§4.3) is satisfied

Human verification alone is NOT a reason to stop.

### 18.2 Exit procedure (MANDATORY)
On exit:
1. ensure all commits are complete on the current branch
2. push the branch to origin
3. open/update PR (if not already) and enable auto-merge only if §11.2 is satisfied
4. provide a final summary:
   - SPEC compliance status
   - remaining TODO items (especially HUMAN-VERIFY / HUMAN-BLOCKED)
   - exact human actions needed (steps, logs, keys)
   - whether convergence is stable or risky
