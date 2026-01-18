# Task 03: BPM Analysis Core

## Goal
Implement beat detection algorithm to estimate BPM and generate Beat Map from audio buffer.

## Scope
**Files to create:**
- `/home/second_bird/dance_deck_copy/services/bpmAnalysis.ts`

**Algorithm approach:**
Choose one of these libraries/approaches:
1. **essentia.js** (WASM-based, high quality) - Recommended
2. **web-audio-beat-detector** (lightweight, Web Audio API)
3. **Custom autocorrelation** (manual implementation, moderate complexity)

## Implementation Requirements

### Function signature:
```typescript
export async function analyzeBPM(
  audioBuffer: Float32Array,
  sampleRate: number
): Promise<{
  bpm: number;
  confidence: number;        // 0.0 to 1.0
  beatTimesSec: number[];    // Beat Map (beat head timestamps)
  tempoFamilyCandidates?: number[];  // For tempo normalization (Task 04)
}>;
```

### Processing steps:
1. Compute onset detection (spectral flux or energy-based)
2. Autocorrelation to find periodicity
3. Peak picking to identify BPM candidates
4. Return primary BPM estimate + confidence
5. Generate Beat Map (beat head timestamps) by:
   - Starting from first detected onset
   - Adding beats at estimated tempo intervals
   - Optionally micro-adjust to align with nearby onsets
6. Return tempo family candidates (BPM, BPM/2, BPM*2) for Task 04

### Quality thresholds:
- Confidence < 0.4 → Low (UI should emphasize Tap Tempo fallback)
- Confidence 0.4–0.7 → Medium
- Confidence > 0.7 → High

## Acceptance Criteria
- [ ] `analyzeBPM()` function exported
- [ ] Returns BPM, confidence, and Beat Map
- [ ] Beat Map has reasonable accuracy (within ±50ms of actual beats)
- [ ] Handles edge cases (silence, noise) gracefully
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint issues: `pnpm lint`
- [ ] Unit test for tempo calculation (at least one test)

## Commands to Run
```bash
# Verify implementation
pnpm typecheck
pnpm lint
pnpm test

# If possible, test with sample audio buffer
```

## Integration Notes
- This service will be called by Task 06 (UI Integration) after audio extraction
- Output will be used by Task 04 (Tempo Normalization) to apply tempo prior
- Beat Map will be used by Task 05 (Beat Map Snapping) for loop snapping

## Research & Dependencies
- If using essentia.js, add to package.json: `essentia.js`
- If using web-audio-beat-detector, add: `web-audio-beat-detector`
- For custom implementation, no new deps needed (pure JS/TS)

## Example Beat Map Format
For a 120 BPM song (0.5s per beat), Beat Map might look like:
```typescript
[0.1, 0.6, 1.1, 1.6, 2.1, 2.6, ...]  // timestamps in seconds
```

## Non-Regression
- This is a new service, no existing code to break
- Must not interfere with existing manual BPM/Tap Tempo logic
