# Task 06: UI Integration & Orchestration

## Goal
Wire the "Auto Detect BPM" button to orchestrate the full analysis pipeline (extraction → analysis → normalization → UI update).

## Scope
**Files to modify:**
- `/home/second_bird/dance_deck_copy/app/video/[id].tsx`

**Specific function to replace:**
- `handleAutoDetectBpm()` (around line 720) - currently shows "Coming soon" alert

**Depends on:**
- Task 01 (Data Model)
- Task 02 (Audio Extraction)
- Task 03 (BPM Analysis)
- Task 04 (Tempo Normalization)

## Implementation Requirements

### Replace Placeholder Handler

**Current code** (line 720):
```typescript
const handleAutoDetectBpm = useCallback(async () => {
  Alert.alert('Coming soon', 'Auto BPM detection will be available in a future update.');
}, []);
```

**New implementation:**
```typescript
const handleAutoDetectBpm = useCallback(async () => {
  if (!videoItem) return;

  // Check Pro gating
  const requiresPro = await isProRequired("bpm_auto_detect");
  if (requiresPro && !proStatus) {
    setShowPaywall(true);
    return;
  }

  // Show progress indicator
  setIsAnalyzing(true);
  setAnalysisProgress("Extracting audio...");

  try {
    // Step 1: Extract audio from video
    const audioData = await extractAudioFromVideo(videoItem.uri, {
      maxDurationSec: 90,
      sampleRate: 22050
    });

    setAnalysisProgress("Detecting BPM...");

    // Step 2: Analyze BPM and generate Beat Map
    const analysisResult = await analyzeBPM(
      audioData.audioBuffer,
      audioData.sampleRate
    );

    setAnalysisProgress("Normalizing tempo...");

    // Step 3: Apply tempo normalization
    const normalized = normalizeTempoWithPrior(
      analysisResult.bpm,
      analysisResult.confidence,
      analysisResult.tempoFamilyCandidates
    );

    // Step 4: Update video metadata
    const updatedVideo = {
      ...videoItem,
      bpm: normalized.normalizedBpm,
      bpmSource: "auto" as const,
      bpmAuto: {
        bpm: normalized.normalizedBpm,
        confidence: analysisResult.confidence,
        tempoFamilyCandidates: normalized.tempoFamily,
        beatTimesSec: analysisResult.beatTimesSec,
        analyzedAt: new Date().toISOString(),
        version: "1" as const
      }
    };

    // Step 5: Save to storage
    await updateVideo(updatedVideo);

    // Step 6: Update local state
    setBpm(normalized.normalizedBpm);
    setVideoItem(updatedVideo);

    // Show success message
    Alert.alert(
      'BPM Detected',
      `Estimated BPM: ${normalized.normalizedBpm}\nConfidence: ${(analysisResult.confidence * 100).toFixed(0)}%${
        analysisResult.confidence < 0.5 ? '\n\nLow confidence. Consider using Tap Tempo to adjust.' : ''
      }`
    );

  } catch (error) {
    console.error('Auto detect BPM failed:', error);

    // Fallback: guide to Tap Tempo
    Alert.alert(
      'Auto Detect Failed',
      'Could not analyze audio. Please use Tap Tempo to set BPM manually.',
      [{ text: 'OK' }]
    );
  } finally {
    setIsAnalyzing(false);
    setAnalysisProgress("");
  }
}, [videoItem, proStatus, setShowPaywall, setBpm, setVideoItem]);
```

### Add State Variables (near top of component)

```typescript
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [analysisProgress, setAnalysisProgress] = useState("");
```

### Update UI to Show Progress

In the BPM panel (around line 1004-1026), update the Auto Detect button:

```tsx
<TouchableOpacity
  onPress={handleAutoDetectBpm}
  disabled={isAnalyzing}
  style={[
    styles.autoDetectButton,
    isAnalyzing && styles.autoDetectButtonDisabled
  ]}
>
  {isAnalyzing ? (
    <>
      <ActivityIndicator size="small" color="#fff" />
      <Text style={styles.autoDetectText}>{analysisProgress}</Text>
    </>
  ) : (
    <Text style={styles.autoDetectText}>Auto Detect BPM</Text>
  )}
</TouchableOpacity>
```

### Add Imports

At top of file:
```typescript
import { extractAudioFromVideo } from '../services/audioExtraction';
import { analyzeBPM, normalizeTempoWithPrior } from '../services/bpmAnalysis';
import { updateVideo } from '../services/storage';
```

## Acceptance Criteria
- [ ] `handleAutoDetectBpm()` orchestrates full pipeline
- [ ] Shows progress indicator during analysis ("Extracting...", "Detecting...")
- [ ] Handles errors gracefully with user-friendly messages
- [ ] Updates video metadata with bpmAuto and bpmSource fields
- [ ] Saves results to storage (cache)
- [ ] Updates UI state (BPM, Beat Map for snapping)
- [ ] Respects Pro gating (shows paywall if not Pro)
- [ ] Shows confidence in result message
- [ ] Guides to Tap Tempo on failure
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint issues: `pnpm lint`

## Commands to Run
```bash
pnpm typecheck
pnpm lint

# Manual test in Expo Go:
# 1. Import video
# 2. Press "Auto Detect BPM"
# 3. Verify progress indicator appears
# 4. Verify BPM updates after analysis
# 5. Verify loop snapping uses Beat Map
```

## Integration Notes
- This task ties together all previous tasks
- Error handling is critical for good UX
- Analysis should be cancelable (nice-to-have, not blocking)
- Results persist via storage service (no additional work needed)

## Non-Regression
- Manual BPM (± buttons) must continue to work
- Tap Tempo must continue to work
- "This is 1" phase correction must continue to work
- Existing loop behavior must not break when auto-detect is not used
