# Maintenance and Verification Harness — Volume 03

## Run and regenerate

Use Node.js 22+ and `node scripts/serve.mjs`; open http://127.0.0.1:8765/. No install/build is needed. Use HTTP, not file://. `node scripts/generate-library.mjs` regenerates the catalog and 80 JSON charts; it does not render/export audio. Saved MP3s are prefetched on selection and decoded after a start gesture. Regenerate audio separately as documented in assets/music/README.md.

Before editing, read AGENTS.md and ARCHITECTURE.md, identify the owning module, and preserve user changes. Update decisions for contract changes. Do not bypass browser permission blocks.

## Automated checks

```sh
npm test
```

- run.js: 12 pure judgement, scoring, correction, and validation cases.
- runtime.js: mock transport lifecycle, legacy short signal, independent 4/6-key input.
- library.js: all ten scores and 80 deterministic charts; exact 120-second metadata; musical cue mapping; mode/difficulty chord caps and spacing; isolated EXPERT ribbons; full perfect replays with held/released keys; Free Play miss replays; STANDARD terminal freeze; speed invariance through 10×.
- expansion.js: ten survival/countdown/mascot/SFX cases.
- volume3.js: nine ribbon continuity/recovery/pause/validation and high-score/tie/name/storage/speed cases.
- saved-audio.js: selection prefetch, decoded cache across modes, HTTP/decode failures, duration mismatch, retry, and PCM WAV encoding.
- synth-graph.js: schedules all ten arrangements through a mock OfflineAudioContext, checking graph construction, automation, source ranges, buffer dimensions, and preparation feedback. It produces no real sound and is not a browser render benchmark.

The browser logic page `/tests/` shares pure suites. `/tests/browser.html` uses saved audio and real AudioContext, Input, Game, and Renderer in Free Play with synthetic key events. It checks full-song timing and completion, changes speed through 10×, and reports frame gaps and source end. This page does not exercise production UI countdowns or high-score dialogs. Keep it visible. Synthetic keys do not verify human playability or physical rollover.

## Manual browser acceptance

1. Select all ten songs and four difficulties in both modes. Check metadata, eight charts per song, and scrollable track list.
2. Start a new song; observe download/decode status, then count-in. Retry/change difficulty: reuse current buffer. Change song: load its saved file. Test missing/corrupt files and retry; confirm no runtime synthesis.
3. Compare new instrument palettes and song sections by listening; check clipping, audible balance, loading latency, and memory on the actual device.
4. Verify D/F/J/K and S/D/F/J/K/L, repeat prevention, two-key chords, judgement, health, terminal failure, Free Play recovery, and full results.
5. Start/pause/cancel during count-in. Confirm no leaked source or SFX. Resume a near-target note without timing drift.
6. For an EXPERT ribbon: hold through a transition, overlap keys, release just under/over 80ms early, deliberately break, recover at the next point, miss the start, pause while holding, and re-hold the indicated anchor during countdown. Verify each checkpoint scores once and no frame-rate-based health loss exists.
7. Change speed using slider and number input at 0.5, 2, 5, and 10. Refresh to verify persistence. Check ribbon geometry and target crossings at all speeds.
8. Complete a first-place run: enter a name, save, reload. Repeat with Skip and Escape. Tie the record: no new-record prompt and old tie remains first. Verify ten-entry limit, mode/revision separation, and no failed-run records.
9. Test storage failure/corruption: session results remain usable, names render as text, and persistence warnings are visible.
10. Test Lumi visibility/reactions, particle quality, reduced motion, resizing/DPR, volume groups, result sounds, calibration, and console errors.

## Evidence and reporting

Record exact commands, selected track/mode/difficulty, browser/OS, audio output device, offset, and observed timing/frame data. Distinguish pure tests, mock graphs, actual browser runs, and physical listening. No score simulation proves audible sync or sustained 60FPS. Preserve failing reproduction steps; add focused regression coverage and rerun affected tests after fixes. Update VERIFICATION.md honestly, including blocked checks and unexecuted UI paths.

## Saved asset checks

Run `node scripts/verify-audio.mjs` with FFmpeg installed after audio regeneration. It decodes deployed MP3s, compares decoded sample counts and alignment with their WAV masters, checks finite samples/peaks and signal in every ten-second segment, and writes assets/music/rendered-v3/verification.json. This is signal analysis, not physical listening or a browser benchmark.

## Pages and record backups

- `node tests/record-backup.js`: export/import, reload, duplicate runs, ties, board limits, atomic rejection, partitions, bounded input, and storage failure.
- `node tests/pages-paths.js`: exact-case static references and HTTP loading under `/CDXPilot0004/` and `/renamed-project/`, including all deployment MP3s and charts. Starts isolated local servers on ephemeral ports; closes them after checks.
- Manually export records, import in another origin, import again, and confirm no duplicates. Try malformed JSON and unavailable storage. Confirm settings remain usable and the backup file control does not close the dialog.
- Publishing is separate from local readiness. Verify the real Pages URL after publication. A static HTTP pass does not prove browser rendering, audio, or download-picker behavior.

## Mobile acceptance

`node tests/touch.js` covers AUTO/TOUCH/KEYBOARD selection, portrait/landscape capability decisions, four/six simultaneous pointers, timed ribbon slides, repeated moves, TAP isolation, shared keyboard/touch ownership, cancellation, leaving bounds, mode clear, and disposal. These tests simulate pointer events; they do not measure browser layout or touch hardware.

On actual iOS Safari and Android Chrome, check 360×640 and 390×844 portrait plus short landscape viewports: after START, no scroll should be required to see notes, the judgement line, touch lanes, health, or pause. Check notches/home indicator/browser toolbar expansion, six-lane lane boundaries, two/three-finger chords, expert slides in both directions, missed/early handoffs, hold/re-hold across pause, rotation, backgrounding, and touch audio activation. Test AUTO on a touch laptop and KEYBOARD override, then confirm a regular desktop retains its layout. Verify settings scroll and file import still work. Record real device/browser findings separately from simulations.

## Lane touch and survival balance regression

Run `node tests/health-balance.js` for difficulty-specific recovery/damage, GOOD recovery, repeated-input immunity, fractional accumulation, failure thresholds, sparse misses among PERFECTs, chord losses, EXPERT checkpoint losses, caps, and Free Play recovery. `tests/touch.js` also checks upper/lower canvas coordinates and scoped gesture cancellation/disposal.

On physical devices, verify tapping the top, middle, and judgement-line portions of each lane, vertical motion without repeated hits, sideways EXPERT slides, pinch and double-tap suppression during play, and normal gestures in menus/settings. Check that removing buttons expands the canvas and keeps the line visible. Browser/OS accessibility zoom is outside page control. Do not report a gesture callback simulation as verified prevention on iOS or Android.

## Mobile 75:25 HUD acceptance

The touch simulation also rejects pointer-down below the canvas and releases a captured pointer moved from the canvas into the lower HUD. On a real mobile browser, verify that the lower quarter contains Lumi, health, score, accuracy, and combo while the title/progress/highway fit the upper three quarters. Check safe areas, short landscape, character-hidden mode, expression changes, scroll-free play, pinch/double-tap blocking, and no judgement from touching the lower HUD. CSS layout and OS navigation gesture behavior require real-device verification.

## Character selection acceptance

`node tests/characters.js` checks both local RGBA sheets and equal grids, nine expression cells on three simulated views, skin changes at unchanged expressions, names, visibility, persisted selection, legacy/unknown ID migration, and unavailable storage. Pages checks include both registered sheets under repository subpaths.

In a browser, click/tap the menu character and select each option; refresh and confirm persistence. Check menu/play/results, paused settings selection, cancel/Escape/focus behavior, keyboard navigation, hidden-character preference, reduced motion, and mobile menu START visibility. Inspect all nine sprite crops at small HUD sizes, including mobile 75:25 layout. Node DOM stubs and PNG metadata do not establish visual correctness or interaction acceptance.

## Sprite spacing regression

`node scripts/verify-character-frames.mjs` (FFmpeg required) checks all eighteen active cells for a minimum two-pixel substantial-art gutter at alpha >32 and saves margin measurements. This threshold intentionally excludes faint glow/noise. It does not verify a perfectly empty alpha border or browser interpolation. Character tests check that sheet/position live on a single inset child and that the outer frame is not a second sheet renderer; selection previews use the same helper.

Inspect all expressions at menu thumbnail, selection card, desktop play/result, and short mobile HUD sizes. Verify that cheer/nod/float and shadow cannot cross the fixed frame into labels, that hair/hands are not clipped, and that character hiding/reduced-motion settings still work. Preserve the mobile 75:25 allocation. Record any browser or device checks separately from PNG alpha analysis.

## Result-frame browser regression

Open `/tests/result-layout.html` over HTTP. This fixture loads the production result section and CSS into 320×568, 390×844, 620×800, and 844×390 frames and uses the real Mascot renderer. It checks both characters and clear/fail states, square frames, sprite containment, mobile title/card separation, and hiding. Animation is frozen for deterministic bounds. A test file being present is not evidence that the browser test was executed. Also inspect the real game result screen with animation on an iPhone.

## Compact combo typography regression

Open `/tests/mobile-hud.html` over HTTP to check production play markup/CSS at 320×568, 390×844, and 844×390. It checks 15px portrait / 12px short-landscape typography, the 20px combo row, panel containment, and one-to-five-digit values. This browser fixture must be run separately from Node checks. On a phone, inspect combo changes with both character choices and the character hidden.

## Revision 4 input and chart regression

Run npm test. Touch tests exercise the full simulated pointer-to-Input-to-Game path in 4/6 lanes: same-finger slides, alternate fingers, reused pointer IDs after lifting, cancellation, capture loss, highway exit, recovery, automatic MISS, health/combo changes, and resume gesture rebinding. Volume 3 tests cover source-aware keyboard grace, input-kind substitution, triple-chord rejection, and old/new record persistence. Library tests replay all 80 charts with both keyboard and source-aware touch inputs, validate the two-note cap and isolated ribbon windows, and retain onset/spacing/failure checks.

On actual devices, repeat lift/re-touch within 80ms, different-finger handoff, cancellation, pause/re-hold, and two-finger 6-key chords. Simulations do not verify physical touch behavior. Existing browser access restrictions must not be bypassed.
