# Architecture — Volume 03

## Ownership and dependencies

main.js composes UI, audio, Game, Input, Renderer, countdown, SFX, calibration, mascot, settings, and records. No module imports main; there are no circular dependencies. Production code does not import tests.

| Module | Responsibility |
| --- | --- |
| music | Ten deterministic 120-second score definitions, section boundaries, note cues, revision-5 chart generator |
| synth | Authoring-only OfflineAudioContext instrument graph, windowed rendering, final soft limiting/fade |
| audio | Live AudioContext, one decoded buffer cache, transport, gains and analyser |
| game | Mutable notes, health/failure, score/combo, held/released sources, HOLD lifecycle (legacy ribbon compatibility) |
| input | Mode-specific key bindings, repeat prevention, down/up callbacks, held physical keys |
| judgement | Pure nearest eligible point and timing classification |
| beatmap | Validate/copy/sort chart and HOLD topology, enforce sustained occupancy |
| renderer / particles | Read-only note/HOLD rendering, bounded reactive effects |
| highscores | Board identity, row validation, names, stable ranking, persistence |
| settings | Validated local preferences and unavailable-storage fallback |
| countdown / sfx | Audio-clock deadline model and cancellable tone voices |
| mascot / calibration | Expression presentation and user-tap correction |

Game alone changes gameplay state. Renderer and mascot consume feedback; they never award points. main snapshots chart, track, play mode, and run ID on start. Controls that could change selection are locked during audio preparation; stale chart requests are discarded by sequence.

## Audio authoring and rendering

Catalog and JSON charts are generated with scripts/generate-library.mjs. This optional authoring step is not a runtime build. Ten score definitions have distinct roots/motifs/chords and the five added tracks have style-specific instruments, drum embellishments, and section boundaries. All charts share one soundtrack per track. Every target corresponds to a score cue; harder charts select finer cues. Rendering and chart generation never use random wall-clock timing.

synth.js schedules local oscillator/noise nodes in a 32 kHz stereo OfflineAudioContext. Formant filters, bell overtones, descending brass filters, distorted guitar harmonics, bass, drums, pads, pan, and a delay bus provide the instrument palette. Event gains are enveloped; rendered samples pass through tanh soft limiting and a three-second tail fade. Preparation yields between scheduling chunks and reports progress. Actual render performance is browser-dependent.

AudioEngine prefetches the selected local MP3 without activating sound. Start activates AudioContext and decodes the saved bytes. Same-track retries and mode changes reuse one AudioBuffer; another track replaces it. Superseded downloads abort. Fetch/decode waits have 30/20-second limits and errors allow retry. Catalog failures never trigger synthesis. Only the legacy short regression fixture retains note-tone synthesis. Production does not import synth.js or require OfflineAudioContext.

Authoring uses tools/render-audio.html or scripts/render-audio.mjs. The latter accepts an optional Node Web Audio implementation; it is not a gameplay dependency. Render ten-second cores with four-second warm-up, retaining the core only. Warm-up exceeds the longest voice plus delay tail; no crossfade or timestamp shift is introduced. Apply limiting/fade on the assembled samples. Store 32 kHz stereo PCM masters in assets/music/rendered-v3 and encode deployment MP3s at 160 kbps with gapless Xing metadata. Sample zero remains chart zero. Audio URLs change without changing chart notes/version or leaderboard fingerprints.

The live graph is source → musicGain → analyser → masterGain → destination; SFX/calibration → sfxGain → masterGain. The analyser therefore excludes interface sounds. Master, music, and SFX settings apply independently.

## Timing, state, and cancellation

States: menu, preparing, countdown, playing, paused, results. Initial count-in is three seconds; resume is two. Countdown and music source use one future AudioContext deadline. Song time = stored position + max(0, context.currentTime - startedAt). Before GO it remains frozen. Input and frames may observe readiness, but neither starts the music by timeout or frame count.

Targets are note.time + offsetMs / 1000. Judgement time subtracts the player input offset; positive correction compensates late input. Expiry uses the same corrected time and runs before hits. PERFECT <=50ms, GOOD <=120ms, MISS <=180ms, with 1e-9s boundary tolerance. Nearest unresolved same-lane point wins, ties use chart order. Empty input has no penalty.

Pause/blur cancels scheduled music and SFX, stores position, clears physical held keys, and suspends game input continuity. Resume asks the player to re-hold an intact active HOLD during countdown. At GO, Game.resumeInputs installs the physical held set without judging notes. Retry constructs a fresh Game and clears effects. Results are guarded against duplicate transitions/sounds.

Note position uses `line - (target - songTime) / (1.8 / speed) * line`. Speed is clamped/quantized to 0.5–10 by quarter steps. It does not change source playbackRate, judgement windows, chart time, or ranking category.

## EXPERT same-lane HOLDs (revision 5)

Catalog notes use {time, lane, type: "hold", group, step}. One group has at least two chronologically ordered checkpoints on one lane. Game owns holdGroups and their points, started/broken/suspended flags, original source, and input kind. Only the start is a press target; nearestNote excludes later HOLD checkpoints. Game.update awards maintenance/end PERFECTs at audio-clock target times if the group started successfully and remains intact. Otherwise each checkpoint is MISS. Each point counts once toward maximum score, health, and combo.

Source release settles due targets before latching the break, so exact END release succeeds and a delayed frame cannot lose already-earned checkpoints. Release/cancel/lane movement breaks the remaining HOLD regardless of another source holding the lane. Repress cannot recover or score later checkpoints. Keyboard and touch HOLDs have no release grace. Standard failure freezes later targets; Free Play continues processing at zero health.

Pause settles due targets before suspending holds. Resume rebinds an intact group's same-kind source held on its lane during count-in; a missing re-hold latches failure, and an already broken group never recovers. Renderer reads state for a vertical body, HOLD/KEEP/END labels, active glow, and failed red segments. It never advances score.

The generator converts previous slide windows into fixed-lane HOLDs with the same three checkpoint times and adds musical-cue TAPs on another lane at the later checkpoints. Validation counts a HOLD as one input even between checkpoint timestamps: one companion TAP is allowed, two are rejected; same-lane TAPs and overlapping sustained groups are rejected with a 180ms boundary margin. All 80 charts use revision 5, separating records from the prior rules without deleting old rows. Audio files and non-EXPERT note patterns are unchanged.

Legacy drag parsing/scoring remains only for older regression fixtures. No catalog chart generates slides, and production TouchInput does not enable slide scoring.

## Difficulty, survival, and records

Revision 3 maps EASY to former NORMAL, NORMAL to former HARD, HARD to former EXPERT. New EXPERT adds further offbeat fills and HOLDs. Revision 4 caps every difficulty and lane mode at two-note chords; revision-5 HOLD occupancy permits only one off-lane companion TAP, so mandatory holds cannot add a third simultaneous input. All 80 charts now advance to revision 5 to separate HOLD judgement, even when TAP notes are unchanged. Validation thresholds for generated same-lane spacing are 160ms for EASY/NORMAL and 80ms for HARD/EXPERT, accommodating the new 172 BPM material.

Health starts at 100 and clamps to 0–100. Immutable HEALTH_RULES map EASY/NORMAL/HARD/EXPERT to MISS −8/−10/−12/−15; PERFECT heals +2 and GOOD heals +1 on every difficulty. Game snapshots the chart difficulty rule, defaulting to NORMAL for legacy charts. Each update rounds to tenths to avoid floating-point drift; only the HUD rounds to an integer. STANDARD latches failed/failedAt at zero; further note processing stops. FREE PLAY does not latch failure and can recover. Only completed nonfailed runs are offered to records.

Board keys include track, lanes, difficulty, play mode, explicit chart version, and a deterministic fingerprint of note data/offset. The fingerprint is for accidental revision separation, not cryptographic security. Each board keeps ten rows sorted by descending score with stable insertion order for ties. A strict first-place improvement opens the name dialog; other qualifying rows use the previous name. Names are sanitized/limited and rendered with textContent. Skip/Escape stores PLAYER. Run IDs deduplicate saves. Scores are local, editable by the device owner, and not anti-cheat protected.

HighScores validates loaded rows, filters duplicates, and tolerates malformed/unavailable storage. Failed writes retain session data and return an explicit persistence warning. No network transmission occurs. Leaderboard values include score, accuracy, combo, name, and date.

## Presentation boundaries

Renderer uses CSS pixels with capped DPR; sorted notes outside the approach window are skipped. Ribbons clip to the highway. Particle budgets stay fixed at 480/240/100 and reduced motion reduces movement. Lumi uses the original nine-cell local sprite with prioritized 400ms reactions. Settings and records never modify score timing. Calibration estimates human/device delay; it does not measure physical loopback latency.

## Static hosting and record portability

Static assets resolve relative to their HTML/CSS/module owner. Do not add domain-root `/assets` paths or hardcode a repository name. The development server accepts BASE_PATH to reproduce project Pages URLs and redirects the mount root to its trailing-slash URL. Production uses GitHub Pages static hosting only; `.nojekyll` avoids a Jekyll build.

HighScores owns backup schema version 1 (`format: particle-beat-records`, `version`, `exportedAt`, `records`). Validate every incoming row and six-part board identity before changing state. Import deduplicates run IDs (existing wins), keeps stable ties, trims top ten per board, and enforces size/count bounds. Preserve old chart identities rather than merging revisions. Persistence failure leaves a session copy that can be exported. UI downloads via Blob URLs and reads user-selected files; it does not send records over the network. localStorage is origin-scoped, not repository-path-scoped; retain the existing key for compatibility.

## Touch input and compact play

Input aggregates sources by identity (`key:<code>`, `pointer:<id>`), exposing one held set and issuing a lane hit only on its first source and a release only on its last. clearHooks allow adapters to drop capture/pointer state on pause, mode change, and restart. Keyboard remains usable with touch. TouchInput owns pointer capture, canvas coordinate mapping, per-pointer lane transitions, and cancellation. It never scores directly.

Game.hit accepts an optional `dragOnly` flag for slide transitions. It still expires notes and maintains hold history, but cannot judge a TAP from movement. Ordinary presses retain previous semantics. In revision 5 production, cross-lane movement releases the original source and breaks its HOLD; no slide press is issued. TAPs and HOLD starts still require a timed press; only started HOLD maintenance/end targets are automatic.

Settings owns inputMode (auto/touch/keyboard). inputEnvironment is pure: AUTO examines touch points/coarse pointers, while compact layout also uses viewport width/height. Manual KEYBOARD disables lane touch without forcing a tall desktop layout on a phone. Main manages environment classes and visualViewport height; the compact grid exists only during play. Menus remain scrollable, safe-area insets are respected, and rotation pauses before remapping active input. Renderer continues sizing from canvas client dimensions and computing the judgement line from that size.

TouchInput binds to game-canvas, with no numbered controls. Renderer reads the shared held set to light touched lanes. Horizontal boundary crossings break an active HOLD; vertical movement within a lane produces no input. PlayGestureGuard attaches non-passive gesture/double-click/touchmove prevention to the play section, gated by compact active play and absence of an open dialog. CSS touch-action:none prevents native gestures on the touch canvas and compact play area. A separate mobile-wide zoom guard now protects menus/dialogs/results while preserving vertical scrolling.

## Compact mobile 75:25 composition

Within compact active play, #play owns the grid: title and progress rows, remaining highway space, and a final 25% HUD row. The upper rows together consume the remaining 75% of safe-area-adjusted height. The arena uses display:contents only in this mode, placing the existing score/health aside and combo/mascot aside in the bottom row without duplicating IDs or reaction state. The canvas remains the sole pointer target. Crossing into the HUD exits its bounding rectangle and releases the lane. Lumi visibility/reactions still come from Mascot and the character preference; hidden state overrides its mobile display rule. Desktop styles are unaffected.

## Character catalog and selection

characters.js owns stable IDs, names, descriptions, and local sheet URLs resolved relative to the module/project root. Settings stores characterId separately from the existing character visibility boolean, preserving legacy preferences. Mascot.setCharacter updates the image and invalidates the cached expression so switching skins at the same expression refreshes the accessible name. Reaction priority/timing is shared; character choice does not touch Game or board keys.

Main owns three Mascot views (menu, play, result). applySettings synchronizes their skin, labels, and visibility. Menu idle/blink samples animation time without activating audio. A native dialog offers two cosmetic choices via buttons with aria-pressed; selection persists and updates every view, while cancel leaves selection unchanged. Access during gameplay is through paused settings; it does not resume play or score input. Preview elements are independent of SHOW CHARACTER so hidden-character users can still choose a skin.

## Sprite isolation

Mascot elements are fixed layout frames. mountCharacterSprite installs one aria-hidden mascot-sprite child; only that child owns the background image/position, shadow, and reaction transform. The outer frame clips overflow and never animates. Selection previews use the same helper and inset rule. The 6% inset is independent of atlas spacing, so adding CSS padding cannot accidentally change sprite-cell coordinates. Animation uses small percentage translations and 1.02 scaling; compact shadows are reduced. Character IDs/preferences and the nine-cell mapping are unchanged. The active catalog points to versioned padded sheets; originals are preserved.

## Result sprite containing block

Every Mascot frame must establish the containing block of its absolute sprite child. Mobile result frames use position:relative with inset:auto, explicit 200×200 dimensions, and normal document flow between the heading and score card. Never change them to position:static: that anchors the child to the larger result section and stretches the sheet. Desktop results use a two-column heading/character grid with a 260px character frame (210px at intermediate widths). Mobile results stack in one column. Both variants retain overflow clipping.

Compact combo typography overrides the general narrow-screen sidebar typography through selector specificity, without `!important`. Keep the combo line within its 20px HUD row, with no wrapping; portrait uses 15px and short landscape uses 12px. General desktop/sidebar typography remains separate.

## Legacy source-aware ribbon connections (revision 4 fixtures only)

Input passes source/kind/fromLane metadata for scoring and emits a separate source-release callback even when another source still holds that lane. Aggregate lane releases retain their existing contract. TouchInput assigns a new gesture identity on every pointerdown (pointer IDs alone can be reused). Only an in-bounds lane transfer preserves the gesture connection. Game owns anchor source/kind and terminal touch-break state: touch checkpoints require the same gesture, an actual slide from the prior lane, and no intervening lift/cancel/exit. Keyboard connections retain first-release history and 80ms grace; switching input kinds cannot substitute for an existing anchor.

A timed MISS may re-anchor the subsequent segment; expired notes never anchor. Resume explicitly rebinds the anchor to a same-kind source held on that lane during count-in. Input settings alone never determine judgement kind; actual event sources do. All catalog boards use chart revision 4, preserving the existing six-part record key and old stored/backup records without migration or deletion.

## Mobile page zoom and entry gate

viewport.js owns pure scale/capability checks, the MobileZoomGuard event lifecycle, and ViewportGate decisions. Main owns screen/audio transitions and the recovery dialog. Mobile detection uses a primary coarse pointer (including large tablets), or touch capability plus a compact viewport, independently of AUTO/TOUCH/KEYBOARD settings. The normal-scale class applies pan-y across scroll containers, with none for active play and range sliders. Form fields use 16px text. The document guard cancels cancellable gesture/double-click and multi-touch menu moves only; it does not intercept pointer events, touchstart, or single-finger scrolling. Game touch moves remain under the existing play guard.

VisualViewport scale differing from 1 by more than 0.02 blocks start/resume; both paths recheck after asynchronous audio work. Zoom during play/countdown pauses and cancels scheduled audio through the existing pause path. Do not overwrite the last normal play height with a zoom-shrunken viewport. While zoomed, remove the page-wide lock and disable its event guard so users can pinch back. Recovery closes the dialog and recalculates layout, but never starts music. No meta-tag reset, reload loop, or inverse CSS scaling is used. Without VisualViewport, prevention remains available but scale detection is unavailable. Browser/OS overrides require device verification.

## Static sharing metadata and branding

index.html owns description, canonical, Open Graph and large-card metadata in its initial head; no JavaScript is needed by a crawler. The canonical/og:url and absolute public sharing-image URL are the deliberate exception to repository-name-independent asset references: they identify the actual published site. Game and icon references stay project-relative. assets/branding owns local promotional artwork and code-native icon exports, with prompt/provenance documentation. No gameplay imports or state change. Renaming the public site requires metadata and sharing-test updates.

## Larger character presentation

Menu frames are 128px desktop / 96px mobile, with a wider selector slot and a two-column mobile track strip. Desktop play uses a square frame up to 240px (170px at intermediate widths), constrained to its sidebar. Compact play retains the 75:25 split and 20px combo row: character size is bounded by sidebar width, 180px, and the safe-area-adjusted quarter-height minus HUD padding/border/combo space. A 6% sprite gutter enlarges visible artwork while preserving clipped frame ownership, small reaction transforms, hidden preferences, and reduced motion. Result frames remain in grid flow, preventing larger characters from overlaying titles or scores.
