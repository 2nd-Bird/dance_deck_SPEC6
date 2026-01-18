# Task 04: Tempo Normalization & ½/×2 Toggle

## Goal
Apply tempo-band prior (80-130 BPM preference) and add UI toggle for ½/×2 tempo adjustment.

## Scope
**Files to modify:**
- `/home/second_bird/dance_deck_copy/services/bpmAnalysis.ts` (add normalization function)
- `/home/second_bird/dance_deck_copy/app/video/[id].tsx` (add ½/×2 toggle button to BPM UI panel)

**Depends on:**
- Task 03 (BPM Analysis Core) must be implemented first

## Implementation Requirements

### Part A: Tempo Normalization Function (services/bpmAnalysis.ts)

Add function:
```typescript
export function normalizeTempoWithPrior(
  rawBpm: number,
  confidence: number,
  beatAlignmentScores?: { bpm: number; score: number }[]
): {
  normalizedBpm: number;
  tempoFamily: number[];  // [bpm, bpm/2, bpm*2]
  reasoning: string;      // For debugging/UI
} {
  const candidates = [rawBpm, rawBpm / 2, rawBpm * 2];

  // Tempo band prior (SPEC 5.6)
  const getPriorScore = (bpm: number) => {
    if (bpm >= 80 && bpm <= 130) return 1.0;   // Primary
    if (bpm >= 60 && bpm < 80) return 0.7;     // Secondary
    if (bpm > 130 && bpm <= 160) return 0.6;   // Tertiary
    if (bpm > 160 && bpm <= 200) return 0.3;   // Rare
    return 0.1;                                 // Outside preferred range
  };

  // Combine beat alignment score + tempo prior
  // Choose candidate with highest combined score

  return {
    normalizedBpm: bestCandidate,
    tempoFamily: candidates,
    reasoning: "..."
  };
}
```

**Integration:**
- Call this function in `analyzeBPM()` after raw BPM detection
- Use normalized BPM as the final `bpm` field in result

### Part B: UI ½/×2 Toggle Button (app/video/[id].tsx)

**Add button near BPM display** (around line 1004-1026 in BPM UI panel):
```tsx
{/* ½/×2 Toggle (only show if bpmSource === "auto") */}
{videoItem?.bpmSource === "auto" && (
  <TouchableOpacity
    onPress={handleTempoToggle}
    style={styles.tempoToggleButton}
  >
    <Text style={styles.tempoToggleText}>½ / ×2</Text>
  </TouchableOpacity>
)}
```

**Handler function:**
```typescript
const handleTempoToggle = useCallback(() => {
  if (!videoItem?.bpmAuto) return;

  const current = bpm;
  const family = [current / 2, current, current * 2];
  const currentIndex = family.findIndex(v => Math.abs(v - current) < 0.1);
  const nextIndex = (currentIndex + 1) % family.length;
  const newBpm = family[nextIndex];

  setBpm(newBpm);
  // Recalculate loop duration and update storage
  handleSave();
}, [bpm, videoItem, handleSave]);
```

## Acceptance Criteria
- [ ] `normalizeTempoWithPrior()` function added to bpmAnalysis.ts
- [ ] Tempo prior weights implemented as specified (80-130 primary, etc.)
- [ ] ½/×2 toggle button appears in UI when bpmSource === "auto"
- [ ] Button cycles through tempo family (½, 1x, ×2)
- [ ] BPM update triggers loop recalculation
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint issues: `pnpm lint`
- [ ] UI layout doesn't break (button fits in BPM panel)

## Commands to Run
```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Integration Notes
- This task extends Task 03's output
- Task 06 (UI Integration) will call the normalization function
- The toggle button provides final user control over tempo ambiguity

## Non-Regression
- Manual BPM (± buttons) must still work unchanged
- Tap Tempo must still work unchanged
- Toggle only appears when using auto-detected BPM
