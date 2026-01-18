# Task 01: Data Model Enhancement

## Goal
Add `bpmAuto` and `bpmSource` fields to VideoItem type for storing auto-detected BPM results.

## Scope
**Files to modify:**
- `/home/second_bird/dance_deck_copy/types/index.ts`

**Changes:**
1. Add optional `bpmAuto` field to `VideoItem` interface with structure:
   ```typescript
   bpmAuto?: {
     bpm: number;
     confidence: number;
     tempoFamilyCandidates?: number[];
     beatTimesSec?: number[];  // Beat Map (beat heads in seconds)
     analyzedAt: string;       // ISO timestamp
     version: "1";
   };
   ```

2. Add optional `bpmSource` field:
   ```typescript
   bpmSource?: "manual" | "auto";
   ```

## Acceptance Criteria
- [ ] New fields added to VideoItem type
- [ ] Fields are optional (backward compatible with existing persisted data)
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No changes to other interfaces (LoopBookmark, etc.)

## Commands to Run
```bash
# Verify type changes
pnpm typecheck

# Ensure no lint issues
pnpm lint
```

## Integration Notes
- These fields will be populated by the BPM analysis service (Task 03)
- Storage service (services/storage.ts) requires no changes - AsyncStorage will handle new fields automatically
- Existing videos without these fields will load with undefined values (graceful handling)

## Non-Regression
- Existing code referencing VideoItem must continue to work
- Optional fields mean no breaking changes to current video loading/saving logic
