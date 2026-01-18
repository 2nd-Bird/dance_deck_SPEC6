# Task 03: BPM Analysis Core

Implement beat detection algorithm to estimate BPM and generate Beat Map from audio buffer

Requirements:
- Create services/bpmAnalysis.ts with analyzeBPM function
- Function takes audioBuffer Float32Array and sampleRate number as inputs
- Returns Promise with bpm number, confidence number 0-1, beatTimesSec array of timestamps, and optional tempoFamilyCandidates array
- Use essentia.js WASM library for high quality analysis (recommended) OR web-audio-beat-detector OR custom autocorrelation
- Compute onset detection using spectral flux or energy-based method
- Use autocorrelation to find periodicity
- Apply peak picking to identify BPM candidates
- Generate Beat Map as array of beat head timestamps in seconds
- Start from first detected onset and add beats at estimated tempo intervals
- Optionally micro-adjust beat times to align with nearby onsets
- Return tempo family candidates for normalization task
- Define confidence thresholds: below 0.4 is low, 0.4-0.7 is medium, above 0.7 is high
- Handle edge cases like silence and noise gracefully

Files to create:
- services/bpmAnalysis.ts

Dependencies:
- Add essentia.js to package.json if using that library
- OR add web-audio-beat-detector if using that

Integration notes:
- Called by UI Integration after audio extraction
- Output used by Tempo Normalization task
- Beat Map used by Beat Map Snapping task

Success criteria:
- analyzeBPM function exported
- Returns BPM, confidence, and Beat Map
- Beat Map accurate within 50ms of actual beats
- pnpm typecheck passes
- pnpm lint passes
- pnpm test passes
- At least one unit test for tempo calculation
