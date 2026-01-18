# Task 07: Cache & Fallback Handling

## Goal
Ensure BPM analysis results are cached per video, reused across sessions, and gracefully handle all failure modes.

## Scope
**Files to modify:**
- `/home/second_bird/dance_deck_copy/app/video/[id].tsx` (add cache checks, failure UX)
- `/home/second_bird/dance_deck_copy/services/storage.ts` (if needed for cache deletion on video delete)

**Depends on:**
- Task 06 (UI Integration) must be complete

## Implementation Requirements

### Part A: Cache Reuse Logic

**In video detail screen load** (useEffect near top):

```typescript
useEffect(() => {
  // When video loads, check if auto-analysis already exists
  if (videoItem?.bpmAuto && videoItem.bpmSource === "auto") {
    // Cache hit: reuse existing BPM and Beat Map
    setBpm(videoItem.bpmAuto.bpm);
    // Beat Map snapping will automatically use videoItem.bpmAuto.beatTimesSec

    console.log('Using cached BPM analysis:', {
      bpm: videoItem.bpmAuto.bpm,
      confidence: videoItem.bpmAuto.confidence,
      analyzedAt: videoItem.bpmAuto.analyzedAt
    });
  }
}, [videoItem]);
```

**In Auto Detect button handler** (Task 06):

Add cache check at the start:
```typescript
const handleAutoDetectBpm = useCallback(async () => {
  if (!videoItem) return;

  // Check if already analyzed
  if (videoItem.bpmAuto && videoItem.bpmSource === "auto") {
    Alert.alert(
      'Already Analyzed',
      `This video was analyzed on ${new Date(videoItem.bpmAuto.analyzedAt).toLocaleDateString()}.\n\nBPM: ${videoItem.bpmAuto.bpm}\nConfidence: ${(videoItem.bpmAuto.confidence * 100).toFixed(0)}%\n\nWould you like to re-analyze?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Re-analyze', onPress: () => runAnalysis() }
      ]
    );
    return;
  }

  // Otherwise proceed with new analysis
  await runAnalysis();
}, [videoItem, runAnalysis]);
```

### Part B: Cache Invalidation on Video Delete

**In storage.ts `deleteVideo()` function:**

The bpmAuto field will automatically be removed when the video is deleted (no extra work needed since we delete the entire VideoItem).

Optional: Add cleanup logging:
```typescript
export async function deleteVideo(id: string): Promise<void> {
  const videos = await getVideos();
  const deletedVideo = videos.find(v => v.id === id);

  if (deletedVideo?.bpmAuto) {
    console.log('Deleting cached BPM analysis for video:', id);
  }

  const updatedVideos = videos.filter((v) => v.id !== id);
  await saveVideos(updatedVideos);
}
```

### Part C: Failure Modes & Fallbacks

Add comprehensive error handling in `handleAutoDetectBpm()`:

```typescript
try {
  // ... analysis steps ...
} catch (error) {
  console.error('Auto detect BPM failed:', error);

  let errorMessage = 'Could not analyze audio. ';
  let fallbackGuidance = 'Please use Tap Tempo to set BPM manually.';

  // Specific error messages
  if (error.message?.includes('no audio')) {
    errorMessage = 'This video has no audio track. ';
  } else if (error.message?.includes('timeout')) {
    errorMessage = 'Analysis timed out. ';
    fallbackGuidance = 'Try a shorter video or use Tap Tempo.';
  } else if (error.message?.includes('low confidence')) {
    errorMessage = 'Could not reliably detect BPM. ';
    fallbackGuidance = 'Use Tap Tempo and "This is 1" for best results.';
  }

  Alert.alert(
    'Auto Detect Failed',
    errorMessage + fallbackGuidance,
    [{ text: 'OK' }]
  );

  // Do NOT save failed analysis to avoid polluting cache
}
```

### Part D: Low Confidence Warning

When confidence is low but analysis succeeds:

```typescript
if (analysisResult.confidence < 0.5) {
  Alert.alert(
    'BPM Detected (Low Confidence)',
    `Estimated BPM: ${normalized.normalizedBpm}\nConfidence: ${(analysisResult.confidence * 100).toFixed(0)}%\n\n⚠️ Low confidence detected.\n\nRecommendation:\n1. Use Tap Tempo to adjust BPM\n2. Use "This is 1" to set phase\n3. Try the ½/×2 toggle if tempo feels off`,
    [{ text: 'OK' }]
  );
}
```

## Acceptance Criteria
- [ ] Cache check added: don't re-analyze if bpmAuto exists
- [ ] Cache reuse on video load (Beat Map used for snapping)
- [ ] Re-analyze option available if user wants to overwrite cache
- [ ] Cache automatically deleted when video is deleted
- [ ] Failure modes handled gracefully:
  - [ ] No audio track → descriptive error
  - [ ] Analysis timeout → guidance to use shorter clip
  - [ ] Low confidence → warning + Tap Tempo guidance
- [ ] Low confidence (< 0.5) shows special warning with recommendations
- [ ] Failed analysis does not pollute cache
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint issues: `pnpm lint`

## Commands to Run
```bash
pnpm typecheck
pnpm lint

# Manual tests:
# 1. Analyze video → verify result saved
# 2. Close and reopen video → verify BPM reused (no re-analysis)
# 3. Try "Auto Detect" again → verify "Already Analyzed" prompt
# 4. Delete video → verify cache removed (reload library, re-import)
# 5. Test with video without audio → verify error message
```

## Integration Notes
- This task ensures robust production behavior
- Cache reuse saves processing time and battery
- Graceful failures maintain user trust in the app

## Non-Regression
- Manual BPM must always work (never blocked by failed auto-analysis)
- Tap Tempo must always work
- "This is 1" must always work
- Videos without bpmAuto must behave exactly as before
