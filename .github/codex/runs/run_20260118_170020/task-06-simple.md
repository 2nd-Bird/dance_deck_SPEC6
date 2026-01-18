# Task 06: UI Integration and Orchestration

Wire the Auto Detect BPM button to orchestrate the full analysis pipeline

Requirements:
- Replace handleAutoDetectBpm placeholder in app/video/[id].tsx around line 720
- Currently shows "Coming soon" alert
- Check Pro gating using isProRequired for "bpm_auto_detect" feature
- Show paywall if Pro required and user not Pro
- Add state variables isAnalyzing and analysisProgress
- Set analyzing true and show "Extracting audio..." progress
- Call extractAudioFromVideo with videoItem.uri, maxDurationSec 90, sampleRate 22050
- Update progress to "Detecting BPM..."
- Call analyzeBPM with audio buffer and sample rate
- Update progress to "Normalizing tempo..."
- Call normalizeTempoWithPrior with analysis result
- Create updated video object with new bpm, bpmSource set to "auto", and bpmAuto object containing normalized bpm, confidence, tempo family, beatTimesSec, current ISO timestamp, and version "1"
- Call updateVideo from storage service
- Update local state with setBpm and setVideoItem
- Show success alert with estimated BPM and confidence percentage
- If confidence below 0.5 show "Low confidence. Consider using Tap Tempo to adjust."
- On error show "Auto Detect Failed" alert and guide to Tap Tempo
- Set analyzing false in finally block

- Update Auto Detect button in BPM panel around lines 1004-1026
- Disable button when analyzing
- Show ActivityIndicator and progress text when analyzing
- Show normal button text when not analyzing

- Add imports for extractAudioFromVideo, analyzeBPM, normalizeTempoWithPrior, and updateVideo

Files to modify:
- app/video/[id].tsx

Success criteria:
- Orchestrates full pipeline correctly
- Shows progress indicator during analysis
- Handles errors gracefully with user-friendly messages
- Updates video metadata with bpmAuto and bpmSource
- Saves results to storage for caching
- Updates UI state for BPM and Beat Map snapping
- Respects Pro gating
- Shows confidence in result
- Guides to Tap Tempo on failure
- pnpm typecheck passes
- pnpm lint passes

Non-regression:
- Manual BPM plus-minus buttons must work
- Tap Tempo must work
- "This is 1" phase correction must work
- Existing loop behavior not broken when auto-detect not used
