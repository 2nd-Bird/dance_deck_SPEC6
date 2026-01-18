# Task 05: Beat Map Snapping Logic

## Goal
Extend existing snap functions to use Beat Map when available, preserving legacy behavior when Beat Map is absent.

## Scope
**Files to modify:**
- `/home/second_bird/dance_deck_copy/app/video/[id].tsx`

**Specific functions/sections to update:**
- `snapLoopStartToBeat()` (around line 370-380)
- Loop start handle PanResponder (lines 465-505)
- Loop end handle PanResponder (lines 507-549)
- Loop range drag PanResponder (lines 551-592)
- Loop length buttons (lines 1029-1050)

**Depends on:**
- Task 01 (Data Model) must be completed first (need bpmAuto.beatTimesSec field)

## Implementation Requirements

### Part A: Update `snapLoopStartToBeat()` Function

**Current behavior** (lines 370-380):
```typescript
const snapLoopStartToBeat = useCallback(
  (value: number, loopDuration: number) => {
    const beat = getBeatDuration();
    const offset = value - phaseMillis;
    const beats = Math.round(offset / beat);
    const snapped = phaseMillis + beats * beat;
    return clampLoopStartForDuration(snapped, loopDuration);
  },
  [getBeatDuration, phaseMillis, clampLoopStartForDuration]
);
```

**New behavior** (with Beat Map support):
```typescript
const snapLoopStartToBeat = useCallback(
  (value: number, loopDuration: number) => {
    // If Beat Map exists, snap to nearest Beat Head
    if (videoItem?.bpmAuto?.beatTimesSec) {
      const beatMap = videoItem.bpmAuto.beatTimesSec;
      const valueSeconds = value / 1000;

      // Find nearest beat head
      const nearestBeatIndex = beatMap.reduce((closest, beatTime, index) => {
        const currentDiff = Math.abs(beatTime - valueSeconds);
        const closestDiff = Math.abs(beatMap[closest] - valueSeconds);
        return currentDiff < closestDiff ? index : closest;
      }, 0);

      const snappedMillis = beatMap[nearestBeatIndex] * 1000;
      return clampLoopStartForDuration(snappedMillis, loopDuration);
    }

    // Legacy behavior (uniform grid) when no Beat Map
    const beat = getBeatDuration();
    const offset = value - phaseMillis;
    const beats = Math.round(offset / beat);
    const snapped = phaseMillis + beats * beat;
    return clampLoopStartForDuration(snapped, loopDuration);
  },
  [getBeatDuration, phaseMillis, clampLoopStartForDuration, videoItem]
);
```

### Part B: Update Loop End Calculation

When loop length is defined in beats and Beat Map exists:
```typescript
const getLoopEndMillis = useCallback(() => {
  if (videoItem?.bpmAuto?.beatTimesSec && loopLengthBeats) {
    const beatMap = videoItem.bpmAuto.beatTimesSec;
    const startSeconds = loopStartMillis / 1000;

    // Find start beat index
    const startBeatIndex = beatMap.findIndex(t => Math.abs(t - startSeconds) < 0.05);
    if (startBeatIndex >= 0 && startBeatIndex + loopLengthBeats < beatMap.length) {
      // End at exact beat index: beats[startIndex + beatsPerLoop]
      return beatMap[startBeatIndex + loopLengthBeats] * 1000;
    }
  }

  // Legacy: uniform beat grid
  return loopStartMillis + (loopLengthBeats * getBeatDuration());
}, [videoItem, loopStartMillis, loopLengthBeats, getBeatDuration]);
```

### Part C: Update Loop Handle Gesture Handlers

**Loop start handle** (lines 465-505):
- On drag, update freely
- On release, snap to nearest Beat Head using `snapLoopStartToBeat()`

**Loop end handle** (lines 507-549):
- On drag, update freely
- On release, snap end to nearest Beat Head
- Recalculate loop length in beats

**Loop range drag** (lines 551-592):
- Already has snapping on release (line 581-582)
- Update to use Beat Map snapping

### Part D: Loop Length Buttons (1029-1050)

When user selects preset beat counts (4, 8, 16, 32 beats):
- If Beat Map exists: calculate end = beats[startIndex + selectedBeats]
- If no Beat Map: use legacy loopDurationMillis = selectedBeats * beatDurationMillis

## Acceptance Criteria
- [ ] `snapLoopStartToBeat()` uses Beat Map when available
- [ ] Loop end calculation uses Beat Map indices when available
- [ ] Loop handle gestures snap to Beat Heads on release
- [ ] Loop length presets snap correctly with Beat Map
- [ ] Legacy behavior preserved when Beat Map is absent (non-regression)
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint issues: `pnpm lint`
- [ ] Manual test: dragging loop handles snaps to beats

## Commands to Run
```bash
pnpm typecheck
pnpm lint

# Manual test in Expo Go:
# 1. Load video without Beat Map → verify legacy snapping works
# 2. Load video with auto-detected Beat Map → verify beat-head snapping works
```

## Integration Notes
- This task upgrades existing snapping behavior without breaking it
- Beat Map comes from Task 03 (BPM Analysis)
- If analysis fails or Beat Map is empty, fallback to legacy grid snapping

## Non-Regression Critical
- **Must preserve exact behavior when Beat Map does not exist**
- Existing manual BPM + phase must continue to work as before
- Loop bookmarks saved before this feature must load correctly
