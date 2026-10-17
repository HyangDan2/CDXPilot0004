# Design Decisions

## 2026-10-17 — Phase 1 baseline
- Buildless ES modules preserve static hosting portability and remove dependency installation.
- Synthesized AudioBuffer provides deterministic local audio, seekable pause/resume, and a complete demo without licensed or generated assets.
- A 120–180ms keypress counts as MISS and consumes its target, resolving the original unspecified interval.
- Positive input offset subtracts from input time; expiry uses the same correction to avoid premature misses.
- Game owns all mutable gameplay data. Rendering never changes scoring state.
- Accuracy uses the full chart maximum, as requested, rather than only judged notes.
- One shipped demo track keeps Phase 1 playable. Track selection exposes that track; a dynamic library and imports are deferred.
- Cosmic hero artwork is CSS-only static artwork. Reactive particles, audio analysis, quality controls, and animated transitions remain Phase 2.
- Dependency-free logic tests are shared between Node and browser. Physical audio and performance require separate device verification.
- Publishing, AI music assets, and final chart balancing remain Phase 3.

## 2026-10-17 — Cosmic Edition expansion
The user explicitly expanded scope to five two-minute tracks, 4/6-key modes, three difficulties, scroll speed, real-browser checks, and advanced particles. These supersede the Phase 1 deferrals above; deployment remains out of scope.

- Render stereo PCM WAVs ahead of playback for stable start-up and simple static hosting. Optional deterministic generation is a developer tool, not a runtime build.
- Shared musical score data drives audio and chart onsets; each track uses one soundtrack for all six chart variants.
- Exactly 120 seconds per song, with a fading outro, provides a predictable full-song test length.
- Cap chords at two notes and validate same-lane spacing to keep beginner hardware demands modest. Human balancing is still required.
- Use one mode definition for keys/colors, parameterize lane rendering, and validate chart lane counts.
- Scroll speed changes approach time only. Audio playbackRate stays unchanged.
- Keep a bounded particle pool and explicit quality settings; respect reduced-motion preferences.
- A calibration click track estimates combined human/device delay. It does not claim objective loopback latency measurement.
- Resolve overdue notes before new hits to avoid a stale miss incorrectly clearing a newly earned combo.
- Browser diagnostics live in tests/browser.html and are absent from the production game UI.
- Preserve the legacy short demo for regression checks, while production loads the new catalog.

## 2026-10-17 — Survival, EXPERT, and Lumi
- Added EXPERT as a fourth difficulty: 40 total charts. Sixteenth-note melodic fills are inserted into the shared score, so all modes/difficulties retain one soundtrack. EXPERT's validated same-lane spacing floor is 100ms, with nearest-note selection unchanged.
- STANDARD starts at 100 health (+2 PERFECT, +1 GOOD, -8 MISS). Zero health is terminal and leaves future notes unresolved. FREE PLAY retains health/scoring but never fails. Mode is snapshotted per run.
- Start uses a three-second count-in; mid-song resume uses two seconds. The music source and GO cue are scheduled at one AudioContext deadline. Visual labels only sample that timeline. Position remains clamped/frozen before the scheduled start.
- Result SFX groups are S, A/B, C/D, and failed. Separate master/music/SFX gains preserve independent volume control and music-only analysis. Every cancellation path clears scheduled audio and voices.
- Lumi is an original built-in image_gen asset: one local transparent 3x3 sheet for nine reactions. Runtime switches grid cells and makes no image-service requests. Keep the prompt/provenance beside the asset.
- Character feedback is read-only, bounded by priority and a 400ms hold. Small motion honors reduced-motion preferences and visibility can be disabled.
- The browser audit remains a Free Play transport/input audit. Countdown, terminal UI, and physical sound checks are explicit separate manual acceptance items.

## 2026-10-17 — Volume 03: browser synthesis, ribbons, and records
- Replaced production WAV loading with OfflineAudioContext rendering, one cached 32 kHz stereo buffer, and preparation feedback. Historical WAVs remain unused rather than being deleted.
- Added five instrumentally distinct scores without vocals or sampled music. Genre cues inform original synthesis; no referenced melody or voice is reproduced.
- Revision 3 shifts EASY/NORMAL/HARD up one former tier and introduces a higher EXPERT. Ten tracks × two key modes × four difficulties yields 80 charts.
- Added EXPERT-only three-point adjacent-lane ribbons in isolated melody windows. Every point is independently scored, with an 80ms release grace, first-release integrity, re-anchoring recovery, and explicit re-hold after pause.
- Increased display speed to 10× without changing music or scoring. Numeric entry and slider share clamping/quarter-step quantization.
- Added browser-local top-ten boards keyed by track/mode/difficulty/play mode/revision plus note fingerprint. Strict records request a name; ties preserve insertion order, failed runs do not enter, and run IDs prevent duplicate saves.
- Real browser origin permission remains unresolved. Mock graph scheduling and pure score replays are documented separately from unexecuted audio/UI checks.

## Saved soundtrack playback (2026-10-17)

A user-reported stall at full-song rendering exposed the cost of constructing/rendering a complete graph before play. Move synthesis into optional authoring tools. Ship gapless MP3 copies and WAV masters; prefetch selected audio and decode after activation. Preserve the AudioContext transport and chart timestamps. Load failures are visible/retryable, with no synthesis fallback for catalog tracks. Windowed authoring bounds graph size; its native execution is not evidence of browser acceptance.

## Pages readiness and portable local records (2026-10-18)

Keep repository-relative paths and add a configurable local mount for static hosting checks. Do not rename the repository or deploy as part of this task. Local records remain personal: add versioned JSON export/import with atomic validation and stable top-ten merging. Keep the existing origin-scoped storage key so existing records remain accessible; moving from localhost to Pages requires manual transfer.

## Mobile input and play layout (2026-10-18)

Use capability detection plus AUTO/TOUCH/KEYBOARD preference, not user-agent model matching. Aggregate physical sources so a second finger or keyboard key cannot prematurely release a lane. Numbered pads use Pointer Events and restrict browser gestures only on their surface. Slide transitions judge EXPERT drag checkpoints only, preserving TAP behavior and existing score identity. A compact touch-only viewport grid moves the highway above decorative content while desktop layout and scrollable menus remain intact.
