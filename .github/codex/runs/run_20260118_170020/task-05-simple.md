# Task 05: Beat Map Snapping Logic

Extend existing snap functions to use Beat Map when available while preserving legacy behavior when absent

Requirements:
- Modify snapLoopStartToBeat function in app/video/[id].tsx around line 370-380
- If videoItem.bpmAuto.beatTimesSec exists, snap to nearest Beat Head from array
- Convert value milliseconds to seconds
- Find nearest beat head by comparing absolute differences
- Convert back to milliseconds and return
- If no Beat Map, use existing legacy uniform grid behavior
- Add videoItem to dependency array

- Add getLoopEndMillis calculation function
- When Beat Map exists and loopLengthBeats defined, find start beat index in Beat Map
- Calculate end as beatMap at startIndex plus loopLengthBeats
- If no Beat Map, use legacy calculation: loopStartMillis plus loopLengthBeats times beat duration

- Update Loop start handle PanResponder around lines 465-505
- On drag update freely, on release snap using snapLoopStartToBeat

- Update Loop end handle PanResponder around lines 507-549
- On drag update freely, on release snap to nearest Beat Head
- Recalculate loop length in beats

- Update Loop range drag PanResponder around lines 551-592
- Already has snap on release, update to use Beat Map snapping

- Update Loop length preset buttons around lines 1029-1050
- When user selects 4, 8, 16, or 32 beats
- If Beat Map exists calculate end as beatMap at startIndex plus selected beats
- If no Beat Map use legacy calculation

Files to modify:
- app/video/[id].tsx

Success criteria:
- snapLoopStartToBeat uses Beat Map when available
- Loop end uses Beat Map indices when available
- Handle gestures snap to Beat Heads on release
- Loop length presets snap correctly with Beat Map
- Legacy behavior preserved when Beat Map absent
- pnpm typecheck passes
- pnpm lint passes
- Manual test: dragging loop handles snaps to beats

Non-regression critical:
- Must preserve exact behavior when Beat Map does not exist
- Existing manual BPM and phase must work as before
- Loop bookmarks saved before feature must load correctly
