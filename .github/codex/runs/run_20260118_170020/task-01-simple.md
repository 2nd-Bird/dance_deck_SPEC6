# Task 01: Data Model Enhancement

Add bpmAuto and bpmSource fields to VideoItem type in types/index.ts

Requirements:
- Add optional bpmAuto field containing bpm, confidence, tempoFamilyCandidates array, beatTimesSec array, analyzedAt ISO timestamp, and version string set to "1"
- Add optional bpmSource field as union type of "manual" or "auto"
- Fields must be optional for backward compatibility
- Run pnpm typecheck and pnpm lint to verify

Files to modify:
- types/index.ts

Success criteria:
- TypeScript compiles without errors
- No lint errors
- Existing videos without these fields still load correctly
