# Task 02: Audio Extraction Service

Create a new service to extract mono PCM audio from video files for BPM analysis

Requirements:
- Create services/audioExtraction.ts with extractAudioFromVideo function
- Function takes videoUri string and optional options (maxDurationSec defaults to 60-90s, sampleRate defaults to 22050 Hz)
- Returns Promise with audioBuffer as Float32Array, sampleRate number, and durationSec number
- Extract audio from video using expo-av
- Convert to mono if stereo by averaging channels
- Resample to target sample rate
- Return PCM samples as Float32Array normalized to -1.0 to 1.0 range
- Clean up temporary files after extraction
- Throw descriptive errors for videos with no audio track
- Throw descriptive errors for unsupported formats
- Analyze only first maxDurationSec seconds for performance

Files to create:
- services/audioExtraction.ts

Integration notes:
- Will be called by UI Integration task
- Output feeds into BPM Analysis task
- Consider using expo-file-system for temp files if needed

Success criteria:
- Function exported and returns correct type
- Handles videos with no audio gracefully
- Cleans up temp files
- pnpm typecheck passes
- pnpm lint passes
