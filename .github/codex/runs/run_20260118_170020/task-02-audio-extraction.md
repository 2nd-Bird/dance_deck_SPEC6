# Task 02: Audio Extraction Service

## Goal
Create a service to extract mono PCM audio from video URI for BPM analysis.

## Scope
**Files to create:**
- `/home/second_bird/dance_deck_copy/services/audioExtraction.ts`

**Dependencies already available:**
- `expo-av` (v16): Can read audio from video
- `expo-file-system`: File handling for temp audio files

## Implementation Requirements

### Function signature:
```typescript
export async function extractAudioFromVideo(
  videoUri: string,
  options?: {
    maxDurationSec?: number;  // Default 60-90s for speed
    sampleRate?: number;      // Default 22050 Hz
  }
): Promise<{
  audioBuffer: Float32Array;  // Mono PCM samples
  sampleRate: number;
  durationSec: number;
}>;
```

### Processing steps:
1. Load video using expo-av
2. Extract audio stream
3. Convert to mono if stereo (average channels)
4. Resample to target sample rate (e.g., 22050 Hz)
5. Return PCM samples as Float32Array (normalized -1.0 to 1.0)
6. Clean up temp files after extraction

### Edge cases:
- Video with no audio track → throw descriptive error
- Very long videos → only analyze first N seconds (configurable)
- Unsupported format → throw descriptive error with message

## Acceptance Criteria
- [ ] `extractAudioFromVideo()` function exported
- [ ] Returns mono PCM audio buffer
- [ ] Handles videos with no audio gracefully (throws error)
- [ ] Cleans up temporary files
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint issues: `pnpm lint`

## Commands to Run
```bash
# Verify implementation
pnpm typecheck
pnpm lint

# Manual test (if possible)
# Import a video and call extractAudioFromVideo() in dev mode
```

## Integration Notes
- This service will be called by Task 06 (UI Integration)
- Output will be fed into Task 03 (BPM Analysis)
- If extraction fails, UI should show error and fall back to Tap Tempo

## Research Notes
- Check if expo-av provides direct audio buffer access or if we need expo-file-system to write temp WAV
- May need to use Web Audio API (via react-native-webview) or native module for PCM extraction
- Consider using expo-media-library for better audio handling if needed
