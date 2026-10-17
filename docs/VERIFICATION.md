# Verification Record — Volume 03 Saved Audio

Date: 2026-10-17

## Implemented

- Ten original 120-second Web Audio compositions and 80 JSON charts: 4/6 keys × EASY/NORMAL/HARD/EXPERT.
- Raised difficulty tiers and EXPERT-only keyboard ribbons with adjacent-lane handoffs and an 80 ms release grace period.
- Note speed from 0.5x to 10x, independent of music playback and judgement timing.
- Local top-ten records partitioned by track, key count, difficulty, play mode, and chart revision/fingerprint; a name dialog for a new first-place score.
- Existing health, game over, Free Play, countdowns, result sounds, Lumi reactions, and reactive particles remain integrated.
- Updated English contributor rules, architecture, harness, and usage documentation.

## Executed checks

- `npm test` passed all seven suites: core, runtime, library, expansion, Volume 03, synthesis graph, and saved-audio loader.
- All 80 generated charts match the deterministic composer and passed all-perfect and Free Play all-miss replays. STANDARD failure freezes remaining judgements.
- The library contains 144 EXPERT ribbons. Other difficulties contain no drag notes. Chart validation checks consecutive steps, adjacent lanes, ordered timestamps, and conflicting notes.
- Difficulty note counts increase. Minimum same-lane spacing is 160 ms for EASY/NORMAL and 80 ms for HARD/EXPERT. Chords are capped at two, or three for six-key HARD/EXPERT.
- Drag tests cover held overlap, release grace, early release followed by repress, recovery after a missed start, and pause/resume anchor rearming.
- Record tests cover stable ordering, ties, top-ten trimming, run deduplication, reload, partitioning, name sanitization, and unavailable storage.
- Speed tests cover the 10x limit, quarter-step normalization, and timing invariance.
- Mock OfflineAudioContext checks cover graph construction for all ten tracks, scheduled parameter ranges, distinct instrument families, progress reporting, and 120-second stereo buffers at 32 kHz.
- JavaScript syntax, duplicate HTML IDs, literal DOM references, and the 80-file chart inventory passed static checks.

## Evidence boundaries

The synthesis graph unit test still uses mocks. Separately, all ten current soundtracks were actually rendered with node-web-audio-api 2.2.0 (Node 24.19.0), using the same authoring graph in ten-second windows with four-second warm-up. FFmpeg encoded the masters to deployment MP3s. This native authoring process is not browser automation.

Actual asset verification passed via scripts/verify-audio.mjs: ten 120-second stereo 32 kHz PCM masters and MP3 decodes; finite samples; peak below 1; nonzero signal in every ten-second section; distinct stereo channels; zero-sample best correlation lag against masters at 4 and 114 seconds. Full measurements are in assets/music/rendered-v3/verification.json. These checks establish codec alignment at the sampled windows, not perceived device synchronization.

Native Web Audio decoding at 48 kHz returned exactly 120 seconds for all ten MP3s, taking 97–106 ms per track on this host. This is not a browser timing measurement. The game now prefetches saved bytes, decodes after activation, reuses the current buffer, and never imports the soundtrack synth. Loader tests cover HTTP errors, decode errors, duration mismatch, retry, and cross-mode reuse.

The last browser access attempt was rejected by the app's saved origin permission for http://127.0.0.1:8765/. No permission-setting change has been confirmed. This update made no alternate-browser or indirect workaround attempt. No live browser acceptance result is claimed.

Actual layout, browser console cleanliness, browser file loading/decoding performance, audible quality, physical keyboard ribbons/chords, name-dialog interaction, 10x readability, countdown transitions, character cropping, and FPS remain unverified. The updated browser audit is available but has not been executed. Physical audio-device latency and perceptual synchronization require listening tests.

## Remaining acceptance work

Follow docs/HARNESS.md in an authorized browser. Run the real-time audit and manually play both key modes, including EXPERT ribbons, pause/resume during a ribbon, game over, Free Play, new-record entry, reload persistence, and high-speed rendering. Listen to all ten compositions and check timing near the beginning and end of each track. Record browser/device details and actual findings before claiming browser acceptance. Deployment remains out of scope.

## Pages and record backup update — 2026-10-18

Added local JSON backup/restore, explicit LOCAL BEST labels, `.nojekyll`, a configurable server mount, and deployment instructions. Static path tests passed for 127 exact-case pages/assets under both `/CDXPilot0004/` and `/renamed-project/`, including all ten deployment MP3s and eighty charts. No root-absolute runtime asset path was found that required rewriting. Backup tests passed for round trip, reload, duplicates, ties, top-ten limits, atomic validation, distinct boards, bounds, and unavailable storage. Actual Pages deployment and browser file-picker/download behavior remain unverified; no deployment was performed.

## Mobile controls update — 2026-10-18

Implemented persistent AUTO/TOUCH/KEYBOARD capability selection, source-aware keyboard/pointer aggregation, numbered four/six-lane pads, EXPERT-only slide judgements, capture/cancel cleanup, resume-anchor re-hold, and compact viewport-height play layout with safe-area padding. Desktop layout rules remain outside the compact touch override.

The full npm test suite passed, including updated Pages checks for 129 exact-case pages/assets under both repository prefixes. Touch simulations passed for portrait/landscape capability decisions, simultaneous four/six-lane input, repeated moves, TAP isolation, overlapping sources, cancellation, out-of-bounds movement, cleanup, early-release/repress failure, and pause/re-hold recovery. Main module syntax, DOM references, and unique HTML IDs passed checks.

No physical mobile device or browser layout run was performed. Scroll-free layout, safe-area/browser-toolbar handling, finger ergonomics, physical multi-touch limits, and iOS/Android audio activation/latency remain device acceptance items. The existing saved browser permission block was not bypassed. Static asset checks and simulated pointer callbacks do not establish those results.
