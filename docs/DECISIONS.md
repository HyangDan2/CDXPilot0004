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

## Full-lane touch and difficulty health (2026-10-18)

Replace numbered touch pads with the canvas as the input surface. Retain audio-time judgement, independent pointer ownership, and EXPERT-only horizontal slide checkpoints. Remove the pad footprint so the highway fills remaining mobile space. Suppress mobile play gestures locally, keeping menus/dialogs scrollable and avoiding a permanent global zoom restriction.

Reduce recovery and raise miss damage by difficulty using the approved table. GOOD no longer heals. Preserve fractional health internally, round the HUD only, and retain Free Play at zero. Scoring/charts and existing local records remain unchanged; this release does not retroactively invalidate previous records.

## Recovery correction (2026-10-18)

Restore PERFECT +2 and GOOD +1 across every difficulty at the user's request. Retain EASY/NORMAL/HARD/EXPERT MISS damage −8/−10/−12/−15, the 100-point cap, and nonterminal Free Play. This supersedes the reduced-recovery values above.

## Mobile lower HUD (2026-10-18)

Reserve the lower 25% of safe-area-adjusted mobile play for the existing reactive character and status values. Keep title, progress, and highway in the upper 75%, raising the judgement line away from the system navigation edge. Use CSS placement of existing elements, preserving desktop layout, character preferences, canvas-only touch ownership, and existing scoped gesture prevention.

## Selectable cosmetic co-pilots (2026-10-18)

Add an original NOVA nine-expression sprite alongside LUMI. Reuse one reaction contract, with a validated character catalog and separate visibility/identity preferences. The menu thumbnail opens a native selector; paused settings offer the same selection. Keep previews visible even if in-game character display is disabled. Bundle generated assets locally and document their generation prompts. Preserve mobile HUD allocation and gameplay/record semantics.

## Sprite padding and animation isolation (2026-10-18)

Original LUMI/NOVA atlases had visible artwork on cell borders. Preserve them and use edited padded siblings. Because generated margins vary, add a deterministic 10% runtime inset and clip the fixed outer frame. Animate only the inner sprite, with smaller movement/scale and shadow. Reuse this structure in selection previews so each surface has the same isolation contract.

## Mobile result containing-block fix (2026-10-19)

The user supplied a screenshot of a vertically stretched result character covering scores. Inspection found that the mobile result rule reset the sprite frame to position:static, while its new child used absolute positioning and percentage insets. Restore position:relative, clear inherited top/right offsets with inset:auto, retain a fixed square, and add normal-flow spacing. Reduce the mobile heading size. No image regeneration is necessary.

## Source-aware touch ribbons and two-finger charts (2026-10-19)

Touch ribbons require one uninterrupted gesture rather than lane-held state or keyboard grace. A unique pointerdown token prevents reused pointer IDs from reconnecting. Per-source release notification is separate from final-lane release so mixed input sources cannot conceal a broken gesture. Keyboard hold transitions retain 80ms grace; resume is an explicit rebind exception. Timed failed checkpoints can re-anchor later segments.

All modes now cap simultaneous targets at two, with existing isolated ribbon windows excluding competing holds/TAPs. Removed only the third-note generation branch; score/audio definitions and four-key notes are unchanged. Regenerated all 80 charts as revision 4, which also separates scores earned under the older touch rules. Existing six-part leaderboard keys and backup format are unchanged; old records remain stored.
