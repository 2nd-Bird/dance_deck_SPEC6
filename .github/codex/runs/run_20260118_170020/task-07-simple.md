# Task 07: Cache and Fallback Handling

Ensure BPM analysis results are cached per video, reused across sessions, and handle all failure modes gracefully

Requirements Part A - Cache Reuse:
- In app/video/[id].tsx add useEffect near top of component
- Check if videoItem.bpmAuto exists and videoItem.bpmSource equals "auto"
- If cache hit, reuse BPM by calling setBpm with videoItem.bpmAuto.bpm
- Beat Map snapping automatically uses videoItem.bpmAuto.beatTimesSec
- Log cache hit with bpm, confidence, and analyzedAt

- In handleAutoDetectBpm add cache check at start
- If videoItem.bpmAuto and bpmSource is "auto" already exist
- Show "Already Analyzed" alert with analysis date, BPM, and confidence
- Offer "Cancel" and "Re-analyze" buttons
- Re-analyze button calls runAnalysis function
- If no cache, proceed with new analysis

Requirements Part B - Cache Invalidation:
- In services/storage.ts deleteVideo function
- bpmAuto field automatically removed when video deleted
- Optionally add console log when deleting cached BPM analysis

Requirements Part C - Failure Modes:
- In handleAutoDetectBpm catch block add comprehensive error handling
- Check if error message includes "no audio" and show "This video has no audio track" message
- Check if error includes "timeout" and show "Analysis timed out. Try shorter video or use Tap Tempo"
- Check if error includes "low confidence" and show "Could not reliably detect BPM. Use Tap Tempo and This is 1 for best results"
- Default fallback message: "Could not analyze audio. Please use Tap Tempo to set BPM manually"
- Do NOT save failed analysis to avoid polluting cache

Requirements Part D - Low Confidence Warning:
- After successful analysis check if analysisResult.confidence below 0.5
- Show special "BPM Detected (Low Confidence)" alert
- Include BPM, confidence percentage, and warning emoji
- Provide recommendations: Use Tap Tempo to adjust, Use "This is 1" to set phase, Try half-double toggle if tempo feels off

Files to modify:
- app/video/[id].tsx for cache checks and failure UX
- services/storage.ts optionally for cache deletion logging

Success criteria:
- Cache check prevents re-analysis if bpmAuto exists
- Cache reused on video load for Beat Map snapping
- Re-analyze option available to overwrite cache
- Cache automatically deleted when video deleted
- No audio track shows descriptive error
- Analysis timeout shows guidance to use shorter clip
- Low confidence shows warning and Tap Tempo guidance
- Low confidence below 0.5 shows special warning with recommendations
- Failed analysis does not pollute cache
- pnpm typecheck passes
- pnpm lint passes

Non-regression:
- Manual BPM must always work never blocked by failed auto-analysis
- Tap Tempo must always work
- "This is 1" must always work
- Videos without bpmAuto behave exactly as before
