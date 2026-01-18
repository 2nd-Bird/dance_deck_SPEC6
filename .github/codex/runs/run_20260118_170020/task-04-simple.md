# Task 04: Tempo Normalization and Half Double Toggle

Apply tempo-band prior to prefer 80-130 BPM range and add UI toggle for half-double tempo adjustment

Requirements Part A - Tempo Normalization Function:
- Add normalizeTempoWithPrior function to services/bpmAnalysis.ts
- Takes rawBpm number, confidence number, and optional beatAlignmentScores array
- Returns object with normalizedBpm, tempoFamily array, and reasoning string
- Generate tempo family candidates: rawBpm, rawBpm divided by 2, rawBpm times 2
- Apply tempo band prior scoring: 80-130 BPM gets 1.0 score, 60-80 gets 0.7, 130-160 gets 0.6, 160-200 gets 0.3, outside range gets 0.1
- Combine beat alignment score with tempo prior
- Choose candidate with highest combined score
- Call this function in analyzeBPM after raw BPM detection
- Use normalized BPM as final bpm field in result

Requirements Part B - UI Toggle:
- Add half-double toggle button to BPM UI panel in app/video/[id].tsx around line 1004-1026
- Button only shows when videoItem.bpmSource equals "auto"
- Button text is "½ / ×2"
- On press, cycle through tempo family: current divided by 2, current, current times 2
- Add handleTempoToggle callback that finds current BPM in family array
- Move to next index in family, wrapping around
- Update BPM state and call handleSave to persist

Files to modify:
- services/bpmAnalysis.ts for normalization function
- app/video/[id].tsx for UI toggle

Success criteria:
- Normalization function added with correct tempo prior weights
- Toggle button appears only when bpmSource is auto
- Button cycles correctly through tempo family
- BPM update triggers loop recalculation
- pnpm typecheck passes
- pnpm lint passes
- pnpm test passes
- UI layout not broken

Non-regression:
- Manual BPM plus-minus buttons still work
- Tap Tempo still works
- Toggle only appears for auto-detected BPM
