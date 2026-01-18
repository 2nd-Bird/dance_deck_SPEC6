SPEC.md
Dance Deck
Beat-Synced Loop Player & Video Deck for Dancers
Addendum 6: BPM Auto Detect (On-device estimation from local video + Beat Map) v1
0. Update Declaration (Explicit, to avoid conflicts)

This Addendum 6 updates (overrides) the following existing statements:

3.3.2 BPM Setting: “No automatic analysis in Phase 1”

In Addendum 5 (Monetization): “BPM Auto Detect: not implemented in the first release, Pro in the future”

However, the monetization positioning remains the same (i.e., it is a Pro feature); gating implementation follows Addendum 5.

1. Purpose (Why)

Analyze audio from local videos on the device (videos imported into the app) and automatically estimate BPM.

Not only estimate BPM, but also internally retain the beat positions so that loop window movement and range adjustments magnetically snap to beat heads.

Minimize double-time / half-time tempo mis-detections, prioritizing tempos that are easy to count in real street-dance practice.

2. Terminology (Added by this addendum)

Beat Map: A time series of beats. beats[] = [t0, t1, t2, ...] (seconds)

Beat Head: The start point of each beat (each ti in the Beat Map)

Tempo Family: The relationship among BPM, BPM*2, and BPM/2 (double/half candidates)

Confidence: A confidence score for the estimate (0.0–1.0), used for UI decisions and fallback behavior.

3. Scope
3.1 In Scope

On-device local videos (video files/URIs managed by the app)

iOS / Android (Expo + EAS Dev Client is sufficient)

3.2 Out of Scope (Not in v1)

Cloud analysis (uploading video/audio) is prohibited. Analysis must be fully on-device.

Support for a “tempo map” where BPM changes significantly within a song (v1 assumes a constant BPM).

Fully automatic detection of the bar downbeat (“1” at bar start) is not guaranteed in v1.

Instead, users can correct phase using the existing “This is 1” button.

4. UI/UX Requirements
4.1 Entry Point

Provide an “Auto Detect BPM” button on the Video Detail screen (in edit mode: when Overlay/Loop Controls are shown).

If the user is not Pro:

Follow Addendum 5 paywall spec: show Paywall (or Pro upgrade flow) upon tap.

If the user is Pro:

Start analysis on tap.

4.2 During Analysis

Analysis must be asynchronous and must not block the UI.

Show a progress indicator (spinner + “Detecting…”) and allow cancellation.

Basic playback controls (play/pause, etc.) may remain available during analysis, but do not update BPM/Beat Map until results are finalized.

4.3 On Success

At minimum, produce:

estimatedBpm

confidence

beatMap (Beat Head timestamps; at least from video start through a certain segment; ideally entire duration)

Update internal state:

BPM (per video)

Beat Map (per video)

Use Beat Map for loop snapping behavior described in Section 5

UI to present to the user:

Estimated BPM (e.g., “BPM 124”)

One-tap switching UI for double/half candidates (e.g., “½ / ×2”)

If confidence is low, emphasize the “Adjust with Tap Tempo” pathway

4.4 On Failure (Fallback)

Example failure conditions:

No audio track / silent audio

Weak onsets (beat cues) and confidence below threshold

Analysis timeout

On failure:

Guide the user to the existing Tap Tempo (Free)

Clearly state that phase can be corrected via the existing “This is 1” button

Failure must not break any existing manual BPM/loop functionality (preserve Free core experience).

5. “Beat-Head Snap” Spec using Beat Map (Most Important)
5.1 Where Snapping Applies

Dragging the center of the Loop Window (move position with fixed length)

Loop Handles (left/right) for adjusting start/end

The existing “one-tap decide loop range” behavior triggered by Loop Length buttons should also snap to beat heads when possible

5.2 Snap Behavior (“Magnetic” UX)

Snap the user’s drag candidate time tCandidate to the nearest beat head tBeat.

Snap strength:

If |tCandidate - tBeat| <= snapThresholdSec, always round to tBeat (magnet)

Otherwise follow smoothly; however, when the finger is released, snap to the nearest beat head

If the drag crosses beats continuously, optional light haptics may be used.

5.3 Priority when Beat Map Exists

If Beat Map exists (detected beat head sequence):

Snapping must prioritize Beat Map

Compute end as the beat head that is beatsPerLoop beats ahead of start (using Beat Map indices)

If Beat Map does not exist (manual BPM only, etc.):

Snap using the existing uniform grid defined by BPM + phase (current behavior)

5.4 Loop Length Guarantee

Beat-count-based loops (e.g., 1 eight / 8 counts) must always contain the specified beat count.

If Beat Map exists: end = beats[startIndex + beatsPerLoop]

If Beat Map does not exist: end = start + beatsPerLoop * (60 / BPM)

6. Minimizing Double/Half Tempo Mis-detection (Street Dance–oriented normalization)
6.1 Basic Policy

The algorithm’s “raw BPM” can drift to double/half values.

In v1, use onset strength and related signals from beat extraction as a score, and choose the best BPM from the Tempo Family (BPM, BPM/2, BPM*2), prioritizing tempos that are easy to count for dancers.

6.2 “Street Dance Standard BPM” Prior (App-internal)

The app must have a tempo-band prior with this preference order:

Primary: 80–130 (most common; easy to count for many street-dance practices)

Secondary: 60–80 (half-time feel; “count slower” culture exists)

Tertiary: 130–160 (faster; plausible depending on genre/track)

Rare: 160–200 (only select when score is clearly high)

Generate Tempo Family candidates from raw BPM, and decide final BPM by combining:

(A) Beat Alignment Score (how well onsets align to beat heads)

(B) Prior (tempo band preference)

The UI must provide a one-tap “½ / ×2” switch (final safety valve).

7. Analysis Pipeline (Implementation Requirements: v1 minimum)
7.1 Preprocessing (Video → Audio for analysis)

Extract the audio track from the video and convert to an analysis-friendly format:

mono

fixed sample rate (e.g., 22050Hz or 44100Hz)

PCM (e.g., WAV)

For performance, it is acceptable to analyze only the first N seconds (e.g., 60–90s) initially.

Only if confidence is low, optionally analyze additional segments to improve results.

7.2 Output

Minimum outputs:

estimatedBpm

confidence

beatTimesSec[] (Beat Map)

Beat Map may be generated as uniform intervals from estimated BPM, but if possible, micro-adjust near onsets so beat heads “stick” to actual audio.

7.3 Caching

Do not re-run analysis for the same video.

Persist analysis results (BPM/Beat Map/Confidence) as video metadata and reuse immediately on future sessions.

If a video is deleted, delete its analysis cache as well.

8. Data Persistence

In addition to existing per-video data (BPM/phase/loop), store:

bpmAuto:

bpm: number

confidence: number

tempoFamilyCandidates?: number[]

beatTimesSec?: number[] # Beat Map

analyzedAt: ISO string

version: "1"

bpmSource: "manual" | "auto"

If bpmSource="auto", the UI must allow displaying/editing BPM (Tap Tempo or ± can override).

When manual edits occur, bpmSource may switch to "manual" immediately (or remain "auto", but behavior must be consistent).

9. Verification (Minimum)

Unit:

Tempo Family normalization (e.g., prioritize 80–130) works as specified

Snap behavior (with and without Beat Map) never breaks beat counts

Integration:

Auto Detect success → loop window movement snaps to beat heads

Auto Detect failure → clean fallback to Tap Tempo without breaking Free core experience

Addendum 5.1: On-device Verification Environment for Monetization (RevenueCat)

RevenueCat SDK does not run in Expo Go.

Purchase-flow verification must use EAS Dev Client / Development build.

Human verification steps (P0):

eas build --profile development --platform ios

Launch via TestFlight or dev client

Show Paywall → purchase → entitlement "pro" reflects

Restore purchases → entitlement "pro" reflects

Since device validation is required, TODOs are treated as HUMAN-BLOCKED / HUMAN-VERIFY.

Addendum 5: App Store Submission & Monetization (RevenueCat-based) v1
0. Terminology (Fix names for UI/feature parts)

Free: The free tier (InEights core)

Pro: The paid tier (controlled via RevenueCat entitlement)

Paywall: Purchase screen shown when users try Pro features (RevenueCat UI or custom UI)

Entitlement: RevenueCat permission name. The app trusts this to enable/disable features.

Bookmark: “Loop Bookmark” that stores loop range/BPM/etc. (existing bookmark feature)

BPM Auto Detect: Feature that estimates BPM via audio analysis (not implemented in first release; future Pro)

1. Monetization Policy (First Release)

Release as a free app with in-app purchase to unlock Pro.

Pro (Paid features)

Loop Bookmarks (creating new bookmarks)

BPM Auto Detect (Pro target; not implemented in v1)

Free Core Features

Manual BPM measurement (Tap Tempo)

8-count / eights-based loop operations (loop window, snapping, length buttons, etc.)

Local video import, playback, mirror, speed change, tags/memo, etc.

However, creating new Bookmarks is Pro

Note: “Free now, paid later” on the App Store is generally possible, but unlocking digital features requires IAP per guidelines (IAP/subscription rules).

2. Pricing & Trial

Price: JPY 250

Trial: 7 days free

RevenueCat design notes

To implement “7 days free”, typically use auto-renewable subscriptions + free trial (intro offer).

One-time purchases generally don’t support a “free trial” concept.

Therefore, Pro is designed as an Auto-Renewable Subscription (e.g., monthly ¥250 with 7-day free trial).

Price changes

App Store Connect allows price changes later for IAP/subscriptions.

Subscription price increases may require user consent under certain conditions.

In v1, assume no price changes.

3. Post-trial Data Retention Rules (Important)

Bookmarks created during trial remain usable after trial ends (user asset retention):

Viewing and applying to playback remains possible.

If trial ends without payment:

Cannot create/edit/delete bookmarks (show Pro upsell)

Applying existing bookmarks (jump to loop range) remains allowed (policy to confirm; disabling harms UX and increases churn)

When Pro is active:

Creating/editing/deleting bookmarks is unlocked

BPM Auto Detect (future) is unlocked

4. Paywall UX Requirements (Do not drop users)

Do not hard-block abruptly; show Paywall at the moment they attempt Pro features.

Minimum paywall triggers

On “Add/Save Bookmark”: if not Pro → Paywall

On “Start BPM Auto Detect”: if not Pro → Paywall (in v1, may be “Coming soon (Pro)”)

Paywall must include

Price (¥250) and billing period (e.g., monthly) + 7-day free

“Cancel anytime”

Restore purchases

Links to Terms of Use / Privacy Policy (URLs)

5. Data & Privacy (App Privacy compliance)

App Store requires privacy information (data collection types, tracking, etc.) in App Store Connect.

In v1, avoid random instrumentation; track drop-off points minimally, e.g.:

paywall_shown, trial_started, trial_converted, trial_canceled, bookmark_create_attempted, etc.

Ensure instrumentation aligns with App Privacy declarations (what is collected and why).

6. v1 Scope (Clarified)
Must do in v1 (for App Store submission)

RevenueCat integration (subscription + 7-day trial + entitlement)

Pro gating (control bookmark creation, restore, paywall)

Prepare the info required for App Privacy submission

Not in v1 (next versions)

Implement BPM Auto Detect (spec fixed, but implementation deferred)

Price change operations policy

Addendum 4: Video Detail UI – Overlay / Timeline / Bookmark Refinements
1. Remove unnecessary elements when Overlay is shown
1.1 Video title display

Remove:

The video title shown when tapping the video surface

The title displayed next to the down arrow icon (top-left)

Reason:

Low need to confirm the video name during playback

Reduce visual noise in Overlay

Decision:

Do not show any video title on the Overlay.

2. Unify visibility rules for Playback Speed / Mirror
2.1 Visibility condition

Show them only when Overlay is visible.

In normal playback (before tapping the video), do not show speed/mirror UI.

2.2 Placement

Consolidate into the Overlay toolbar.

When Overlay is hidden, they must be fully hidden.

3. Overlay toolbar order (Final)

Left → Right:

Playback Speed

Mirror

Loop ON / OFF

Note:

Loop ON should not be a standalone badge; it should be an actionable icon within the Overlay.

4. Timeline / Loop precision
4.1 Forbidden: 1-second granularity movement

Reason:

Dancers must catch “the one” precisely

1-second steps are too coarse

4.2 Requirement

Loop range movement on the Timeline must be continuously adjustable at sub-second resolution.

It does not need to be sample-accurate, but must “feel finely controllable.”

4.3 Time display

Keep the current time display at top-right of the Timeline (e.g., 0:00–0:17) unchanged.

5. Loop Bookmark thumbnail spec
5.1 Thumbnail image

Use the frame at loop start as the thumbnail.

Thumbnails from loop middle or end are prohibited.

5.2 Remove unnecessary UI

Remove the “saved” icon shown at the bottom-right of the Loop Bookmark thumbnail.

Reason:

Bookmarks existing already implies “saved”; state icon is redundant.

6. Animation position for double-tap skip feedback
6.1 Current issue

The “+5s” animation appears in an unnatural position.

6.2 Change

When double-tapping left/right while Overlay is shown:

Align the “+5s / −5s” animation vertically with the Play/Pause icon.

Do not push it too close to the top.

7. Remove all text headers
7.1 Remove these section headers (Text components)

“Timeline”

“Metadata”

“Loop Bookmarks”

7.2 Alternative (only if needed)

If visual separation is needed, use a Divider:

height: 0.5

backgroundColor: '#333'

Do not use text labels. Convey meaning via shape/layout/behavior.

8. Design intent (Important for Codex)

This screen is not a “settings page”; it is an operation screen used repeatedly during practice.

Information appears only when needed.

Every visible UI element must be actionable (tappable/draggable).

Do not create UI that looks like “status-only display”.

End of Addendum 4.

Addendum 3: Video Player UI / Loop UX Improvements (Dance-Focused)
0. Terminology (Important — Codex must follow)

Video Surface: The area where the video is displayed; tap/double-tap gesture target.

Overlay Controls: Temporary UI shown on top of Video Surface (Play/Pause, etc.). Hidden by default.

Persistent Controls: Controls always visible even when Overlay is hidden (Mirror/Speed, etc.).

Timeline: Horizontal thumbnail strip for editing. Mental model matches iOS Photos video editor.

Loop Window: Yellow rectangular frame on the Timeline, indicating loop range (start–end).

Loop Handles: Left/right edges (resize) and center (move) of Loop Window.

Loop Controls: UI group controlling loop behavior (On/Off, Loop Length, etc.).

1. Top-level UX principles (Most Important)

Because this app is for street dancers’ repetitive practice, prioritize:

Zero cognitive load: immediate affordance of “tappable/movable”

Minimal steps: gesture-first interaction, no button hunting

Reuse proven mental models: YouTube / Instagram / iOS Photos

Minimal occlusion: UI must not block choreography viewing

2. Video Surface / Overlay Controls
2.1 Skip (±5s)

Current: rotate arrow icons on left/right

Proposed: remove icons; use double-tap gestures

Behavior:

Double tap right → +5s (future: +1 eight)

Double tap left → −5s

Feedback:

Ripple at tap position + brief “+5s / −5s” text

Rationale:

Established YouTube/Instagram mental model; “hit without searching”

2.2 Play / Pause

Current: always visible in center

Proposed: show only during interaction; fade out during playback

Rationale: iOS Photos / YouTube prioritize video visibility

2.3 Mirror / Speed

Current: bottom area

Proposed: keep placement, but improve visibility (shadow/contrast)

Rule: unify behavior when Overlay hides:

Either (1) always visible, or (2) re-show via tap — pick one consistent rule

Rationale: TikTok/Instagram: frequent adjustments must be immediately accessible

3. Progress Bar (Seek)

Current: thin line + red dot

Proposed: visually thin but with a thick hit target

Implementation note: use hitSlop / invisible padding

Rationale: iOS Music / YouTube: reliable touch even with sweaty hands

4. Loop & Timeline (Core)
4.1 Timeline Visual

Timeline is a concatenated strip of video thumbnails

Adopt iOS Photos editor UI as the mental model

4.2 Loop Window (Yellow frame)

Current: iOS-style yellow frame

Decision: keep as-is (very good)

Clarification:

Drag center: move position with fixed length

Drag left/right: resize

Rationale: match iOS Photos, minimal learning cost

4.3 Loop On / Off

Current: black “Loop On” badge

Proposed: make it a toggle or integrate as a repeat icon at Timeline left

Rationale: avoid UI that looks like status-only; match iOS Music repeat icon

4.4 Loop Length (counts / eights)

Current: white pill buttons

Proposed: place directly above Timeline; tap applies immediately

Animation: on tap, Loop Window resizes to that length

Rationale: CapCut / Video Leap: keep “setting” close to its effect

5. Loop Length labeling rule (Dance-culture aligned)

Conclusion:

In US street dance / hip-hop contexts, “8 counts = one eight”, “16 counts = two eights” is commonly used, especially in choreographer/rehearsal contexts.

Labeling:

≤4 counts: “4 counts”

8 counts: “1 eight”

16 counts: “2 eights”

32 counts: “4 eights”

6. Loop Bookmarks

Current: thumbnail + BPM + Length

Proposed: show only Length (eights/counts)

Rationale: dance music typically has constant BPM; remove redundant info

7. Final information hierarchy

Normal (Overlay hidden):

Video Surface

Loop Bookmarks

Metadata (Tags, Memo)

Edit mode (Overlay shown):

Video Surface

Loop Controls

Timeline + Loop Window

Loop Bookmarks

Metadata

End of Addendum 3.

Addendum 2: Loop / Timeline UI & Interaction
Terminology (Important — Codex must follow)

Video View: main playback area (full width, keep aspect ratio)

Overlay Controls: playback UI over Video View (play/pause, etc.)

Timeline: time-axis UI built from horizontally connected thumbnail frames

Loop Frame (Loop Range): yellow rectangular frame on Timeline indicating loop playback range

Loop Controls: Loop On/Off + Loop Length buttons

Loop Bookmarks: list of saved loops; tile UI matches Home library tiles

Metadata: tags, memo, etc.

Timeline visual requirements

Timeline must match the visual structure of the iOS Photos video editor:

horizontal strip of connected video thumbnails

not a single-color bar

Loop Frame (yellow outline) spec

Loop Frame must exactly enclose the thumbnail strip height/position.

Loop Frame width must match selected Loop Length.

Loop Frame interactions:

left/right handles adjust start/end

dragging the whole frame moves horizontally while keeping length

Visibility rules (Very Important)

Loop Controls and Timeline must not be always visible.

Normal state (video not tapped):

Order:

Video View

Loop Bookmarks

Metadata

No Loop/Timeline directly under Video View in normal state.

Edit state (tap video):

Tapping video shows Overlay Controls

At the same time, show Loop Controls + Timeline

Order:

Video View

Loop Controls

Timeline

Loop Bookmarks

Metadata

Tap video again:

Hide Overlay Controls + Loop Controls + Timeline; return to normal state.

Loop Bookmark tile content

Display:

video thumbnail

loop length (e.g., “2 eights”)
Do not display BPM.
Reason: dance music is assumed to have constant BPM.

Loop Length labeling (International)

Prefer “eights” over “counts” for 8+ counts.

Actual Length	Label
4 counts	“4 counts”
8 counts	“1 eight”
16 counts	“2 eights”
32 counts	“4 eights”

End of Addendum 2.

Addendum: Video Detail (Playback + Loop Edit Screen) UI/UX Redesign

The Video Detail screen is designed with the highest priority on:
a playback and range-selection experience optimized for loop practice.

These changes are reorganizations and re-layouts of existing features, not new feature additions.

1. Information Architecture

Screen structure (top → bottom):

Video View (video display)

No UI by default

Tap to show overlay controls

Playback / Loop operation layer

Only playback/loop controls

BPM and detailed settings are not always visible

Loop Length Selector

4 / 8 / 16 / 32 counts

primary action to set loop length instantly

Unified Timeline

shows playhead + loop range in a single timeline

Loop Bookmarks

same tile visuals as Home library

Metadata

tags

memo (autosave)

2. Interaction Design
2.1 Playback & loop control principles

Loop is a single toggle (ON/OFF only)

Do not permanently show Smart Loop / BPM Tap buttons

BPM setting / Tap is an auxiliary UI shown only when needed

2.2 Loop Length Selector (counts)

When user presses 4/8/16/32 counts:

Use current playhead (or loopStart) as reference

Compute loop range instantly based on BPM
After setting:

User can manually refine range (snap can be released/overridden)

2.3 Unified Timeline (Most Important)

Structure (imitate iOS standard trim UI):

one horizontal timeline with:

center playhead (play position)

yellow loop range frame

left handle = loopStart

right handle = loopEnd

Interactions:

drag left handle: change start

drag right handle: change end

drag inside frame: move range while preserving length

tap/drag on timeline: move playhead only (does not interfere with loop range)

Mis-tap prevention:

separate hit areas for playhead vs loop actions

enforce min/max loop length

visually emphasize during loop editing

3. Visual Design

Principles:

strongly reference iOS standard trim UI

minimal learning cost

delegate aesthetic quality to OS conventions

minimize new custom UI

Guidelines:

Unified Timeline: iOS-trim-like frame/handles/colors

Loop Bookmarks: same component as Home library tiles

eliminate persistent UI; prefer UI that appears only when touched

4. Implementation Notes (For Codex)

This is a UI redesign; it must not require data model changes.

Reconnect/reposition existing:

loopStart / loopEnd

BPM / counts

Bookmark feature

If unclear, do not guess: propose a SPEC.md update PR.

End of addendum.

1. Overview
1.1 Concept

Dance Deck solves the everyday pain of video management for street dancers and provides a practice experience optimized for 8-count culture.

It centralizes personal practice videos and locally saved MVs / reference videos, and focuses its value on enabling users to create and play beat-synced fixed-length loops with minimal operations.

No SNS video acquisition / downloading / link management

Assumes dancers already have local videos

Remove “searching” time; maximize “dancing” time

1.2 Target Users

Primary:

Beginner to intermediate street dancers

Secondary:

K-POP / TikTok dance cover practitioners

Dance instructors (choreo breakdowns / teaching material preparation)

2. Development Policy
2.1 Phases

Phase 1:

Focus on “integrated video library” + “practice experience centered on fixed-length loops”

Phase 2:

Add advanced features like side-by-side comparison (not covered in this spec)

2.2 Platforms

iOS

Android

2.3 Tech Stack

Expo (React Native)

EAS / Dev Client assumed

Local video playback only

Serverless (fully local)

3. Feature Spec (Phase 1)
3.1 Video Management
3.1.1 Home Screen (Video Library)

UI concept:

Tile grid aligned with Instagram profile grid

Minimize text; thumbnails are the primary surface

Displayed:

video thumbnails only

no title/tags/memo on tiles

Interaction:

tap a tile → navigate to Video Detail

scroll to view all videos

3.1.2 Importing Videos

Sources:

local device videos only

Flow:

browse device storage

user selects a video

Internal handling:

copy into app-managed storage, or store reference path (implementation choice)

3.1.3 Search

tag-based search

AND / OR conditions

search UI at the top of Home screen

3.2 Video Detail Screen (Most Important Screen)
3.2.1 Overall layout (portrait)
┌──────────────┐
│  Video Player │
│ (loop / beat) │
├──────────────┤
│ Loop Bookmarks│  ← tiles
├──────────────┤
│ Tags          │
├──────────────┤
│ Memo          │
└──────────────┘


Landscape:

video full-screen

controls overlay like YouTube

3.2.2 Playback UI

play / pause

seek bar

playback speed (0.25 / 0.5 / 0.75 / 1.0)

mirror (horizontal flip)

UI policy:

controls appear on video tap

clean and intuitive, referencing YouTube interaction

3.3 Advanced Practice Tools (Core)
3.3.1 Principles

non-destructive editing

never modify source video

store everything as configuration data

3.3.2 BPM Setting

Methods:

Tap Tempo

fine-tune with ± buttons

Spec:

BPM stored per video

(NOTE: overridden by Addendum 6 for Auto Detect)

3.3.3 Phase (“Beat Start”) Setting

During playback, tap “This is 1”

Record current play position as the beat grid origin

3.3.4 Fixed-length loops

Loop length presets (counts):

4 counts

8 counts (1 eight)

16 counts (2 eights)

32 counts (4 eights)

3.3.5 Loop Window Slide UX (Key Differentiator)

Concept:

loop length is fixed

only position slides horizontally

always snaps to beats

UI:

on the progress/timeline bar:

playhead

fixed-width loop window

draggable left/right

Behavior:

on release, snap to nearest beat

compute loop start/end automatically

3.3.6 Loop Playback Behavior

If playPosition >= loopEnd - epsilon:

auto-seek to loopStart

epsilon absorbs device differences (e.g., 0.05s)

3.4 Loop Bookmarks
3.4.1 Definition

Save “this video with this loop setting.”

Saved fields:

BPM

phase

loop length (counts)

loop start position

3.4.2 Bookmark UI

within Video Detail

tiles displayed directly under the video

same tile design as Home library tiles

Interaction:

tap tile → apply loop immediately

multiple bookmarks per video

Use cases:

practice multiple parts of an MV

multiple segments for choreography breakdown

lesson preparation

3.5 Metadata

Tags:

free input

with autocomplete

Memo:

free text

practice notes, cautions, etc. (autosave)

4. Data Storage Policy

fully local storage

no external server

Persist:

video references

BPM / phase / loop settings

loop bookmarks

tags / memo

5. Explicit Non-goals (Phase 1)

SNS integration

URL import

recording feature

overlays / comparison playback

cloud sync

account registration

6. UX Success Criteria

from selecting a video to entering a loop instantly

dancers can use it without reading instructions

users feel “this loop experience alone is worth installing”

7. Phase 2 (Reference)

BPM auto analysis

comparison playback

recording assistance
