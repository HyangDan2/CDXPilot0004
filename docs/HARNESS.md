# Maintenance and Verification Harness — Volume 03

## Run and regenerate

Use Node.js 22+ and `node scripts/serve.mjs`; open http://127.0.0.1:8765/. No install/build is needed. Use HTTP, not file://. `node scripts/generate-library.mjs` regenerates the catalog and 160 JSON charts; it does not render/export audio. Saved MP3s are prefetched on selection and decoded after a start gesture. Regenerate audio separately as documented in assets/music/README.md.

Before editing, read AGENTS.md and ARCHITECTURE.md, identify the owning module, and preserve user changes. Update decisions for contract changes. Do not bypass browser permission blocks.

## Automated checks

```sh
npm test
```

- run.js: 12 pure judgement, scoring, correction, and validation cases.
- runtime.js: mock transport lifecycle, legacy short signal, independent 4/6-key input.
- library.js: all twenty scores and 160 deterministic charts; exact 120-second metadata; musical cue mapping; mode/difficulty chord caps and spacing; EXPERT HOLDs plus companion TAPs and sustained two-input occupancy; full perfect keyboard/touch replays; Free Play miss replays; STANDARD terminal freeze; speed invariance through 10×.
- expansion.js: ten survival/countdown/mascot/SFX cases.
- volume3.js: nine ribbon continuity/recovery/pause/validation and high-score/tie/name/storage/speed cases.
- saved-audio.js: selection prefetch, decoded cache across modes, HTTP/decode failures, duration mismatch, retry, and PCM WAV encoding.
- synth-graph.js: schedules all twenty arrangements through a mock OfflineAudioContext, checking graph construction, automation, source ranges, buffer dimensions, and preparation feedback. It produces no real sound and is not a browser render benchmark.

The browser logic page `/tests/` shares pure suites. `/tests/browser.html` uses saved audio and real AudioContext, Input, Game, and Renderer in Free Play with synthetic key events. It checks full-song timing and completion, changes speed through 10×, and reports frame gaps and source end. This page does not exercise production UI countdowns or high-score dialogs. Keep it visible. Synthetic keys do not verify human playability or physical rollover.

## Manual browser acceptance

1. Select all twenty songs and four difficulties in both modes. Check metadata, eight charts per song, and scrollable track list.
2. Start a new song; observe download/decode status, then count-in. Retry/change difficulty: reuse current buffer. Change song: load its saved file. Test missing/corrupt files and retry; confirm no runtime synthesis.
3. Compare new instrument palettes and song sections by listening; check clipping, audible balance, loading latency, and memory on the actual device.
4. Verify D/F/J/K and S/D/F/J/K/L, repeat prevention, two-key chords, judgement, health, terminal failure, Free Play recovery, and full results.
5. Start/pause/cancel during count-in. Confirm no leaked source or SFX. Resume a near-target note without timing drift.
6. For an EXPERT HOLD: press the start on time, keep the original key/finger held through KEEP and END, and play companion TAPs with another key/finger. Verify no release timing is required after END. Release early, cancel touch, move lanes, replace the original finger, and re-touch: the whole HOLD must disappear with exactly one MISS and one HP penalty. Pause intact/broken HOLDs separately; intact groups require re-hold during count-in, and broken groups must remain broken.
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

On actual iOS Safari and Android Chrome, check 360×640 and 390×844 portrait plus short landscape viewports: after START, no scroll should be required to see notes, the judgement line, touch lanes, health, or pause. Check notches/home indicator/browser toolbar expansion, six-lane lane boundaries, two-finger chords, stationary HOLDs, early release and companion TAPs, hold/re-hold across pause, rotation, backgrounding, and touch audio activation. Test AUTO on a touch laptop and KEYBOARD override, then confirm a regular desktop retains its layout. Verify settings scroll and file import still work. Record real device/browser findings separately from simulations.

## Lane touch and survival balance regression

Run `node tests/health-balance.js` for difficulty-specific recovery/damage, GOOD recovery, repeated-input immunity, fractional accumulation, failure thresholds, sparse misses among PERFECTs, chord losses, EXPERT checkpoint losses, caps, and Free Play recovery. `tests/touch.js` also checks upper/lower canvas coordinates and scoped gesture cancellation/disposal.

On physical devices, verify tapping the top, middle, and judgement-line portions of each lane, vertical motion without repeated hits, stationary EXPERT HOLDs with off-lane TAPs, pinch and double-tap suppression during play, and single-finger vertical scrolling in menus/settings. Check that removing buttons expands the canvas and keeps the line visible. Browser/OS accessibility zoom is outside page control. Do not report a gesture callback simulation as verified prevention on iOS or Android.

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

## Legacy revision 4 input regression

Run npm test. Touch tests exercise the full simulated pointer-to-Input-to-Game path in 4/6 lanes: same-finger slides, alternate fingers, reused pointer IDs after lifting, cancellation, capture loss, highway exit, recovery, automatic MISS, health/combo changes, and resume gesture rebinding. Volume 3 tests cover source-aware keyboard grace, input-kind substitution, triple-chord rejection, and old/new record persistence. Library tests replay all 160 charts with both keyboard and source-aware touch inputs, validate the two-note cap and isolated ribbon windows, and retain onset/spacing/failure checks.

On actual devices, repeat lift/re-touch within 80ms, different-finger handoff, cancellation, pause/re-hold, and two-finger 6-key chords. Simulations do not verify physical touch behavior. Existing browser access restrictions must not be bypassed.

## Page-wide mobile zoom regression

The npm test suite includes tests/viewport.js: scale detection (including keyboard-height changes and missing API), phone/tablet versus desktop capabilities, cancellable zoom events, single-finger scrolling, game multi-touch isolation, listener disposal, recovery without automatic start, and a simulated asynchronous entry recheck. These are mocked event/gate checks, not browser gesture acceptance.

On iOS Safari and Android Chrome, attempt pinch/double-tap in menu, track list, settings, result, and name entry. Verify vertical list/dialog scrolling, sliders, buttons, record entry, and 4/6-lane multi-touch/ribbons. Enter with a pre-zoomed page (or a browser override): START/RESUME must show recovery without music/countdown; pinch back, then explicitly retry. Repeat a scale change during loading, countdown, and play; check pause and same-position resume. Rotate a tablet; test browser toolbars and software keyboard without false zoom alarms. Check desktop zoom/scroll remains unchanged. Never bypass browser access restrictions to perform these checks.

## Revision 5 HOLD regression

Run npm test (including tests/holds.js). Validate keyboard and touch starts, automatic maintenance/end points, companion TAPs in both lane modes, release before/at/after END, duplicate scoring, no repress recovery, original-source identity despite another finger holding the lane, pointer cancellation/capture loss/lane exit, offset corrections, missed start, and STANDARD/Free Play. Verify pause settles due points, intact re-hold can resume, missing re-hold breaks the group, and broken HOLDs never recover via pause.

Library tests independently count active HOLD occupancy at every target, including between maintenance checkpoints. Every chart must require at most two simultaneous inputs, contain no slide notes, and complete perfect keyboard/touch replays. Chart version 5 isolates records; previous records remain stored. Older slide fixtures in touch/volume3/health tests exercise compatibility only.

The browser audit now holds keys through END instead of issuing slide transitions. On physical phones and desktop, inspect vertical body visibility at 0.5–10x, intact/failed colors, one-hand HOLD plus second-finger TAP, and pause captions. Check menus, zoom guards, and mobile HUD are unchanged. Automated simulations do not establish browser rendering, physical gestures, or audio sync.

## Sharing and favicon regression

Run npm test. tests/sharing.js checks unique static metadata, title/description/image consistency, canonical Pages prefix, image PNG signature/1200×630 dimensions/size budget, relative icon paths, ICO sizes and Apple/PNG dimensions. pages-paths.js serves every branding image under both repository prefixes and checks HTTP 200 and MIME types.

After publication, read the live HTML and fetch the absolute og:image URL and icons. Confirm no redirects to a login page or missing repository prefix. Then inspect previews in the intended social service and browser tab/home-screen icons. Do not send a message to another person without authorization. Services may retain cached previews; use their preview refresh tools or a new versioned image when needed. HTTP/metadata checks are distinct from actual social-card acceptance.

## Larger character layout acceptance

The result-layout browser fixture now covers 1280px desktop as well as phone/tablet widths, checking 260/210/200px frames and title/card separation. The mobile-hud fixture mounts both actual character views, checks square bounded HUD frames and combo separation, hidden preference, 96/128px menu frames, and track-strip overflow. These browser fixtures must be executed separately; Node syntax/character tests do not verify their CSS geometry. On physical phones, check safe areas and short landscape; on desktop, check 4/6-key sidebar widths, all expressions, reduced motion, and hidden characters.

## Revision 6 challenge and HOLD failure contract

The catalog has twenty 120-second tracks and 160 charts. Original tracks retain EXPERT-only HOLDs; new challenge HARD charts explicitly declare holdTier:"hard". Generation uses seeded random lane/pattern choices with onset, spacing, and sustained two-input occupancy validation. Replay never randomizes notes. A failed HOLD immediately resolves its entire group with one MISS/event/HP loss; remaining points are forfeited without extra damage and remain in maximum score. Preserve earned points, separate companion TAPs, pause exemptions, no re-touch recovery, and old record partitions. Verify missing starts, early source release/cancel, duplicate callbacks, missing resume re-hold, exact END release, STANDARD and Free Play. The play screen has no EXPERT HOLDS help paragraph.

## Release cache identity

The HTML entry and changed revision-6 gameplay modules use the explicit query version 6.1; CSS uses the same release identity. Bump affected URLs when removing DOM elements or changing linked module contracts so cached prior scripts cannot reference removed markup. tests/startup-contract.js checks this static contract and required visibility elements; it does not execute browser startup. Previously open tabs must reload to obtain new HTML.

## Signal regression

Run npm test, including tests/signals.js. It verifies ten members per group, legacy saved-track migration, independent remembered tracks, reload, unknown/cross-group IDs, storage failure, preserved settings and board identity, release URL/revalidation, and rejection of stale ten-track catalogs. Static path checks cover every song and chart under both repository prefixes. Tests do not execute actual browser tab navigation or establish phone layout.

On desktop and phone, open TRACK SELECT, switch SIGNAL 1/2, choose a different song in each, reload, and verify active and remembered selection. Exercise arrow/Home/End keys, rapid switching during chart loads, menu/result entry points, scroll to the tenth song, and landscape. Verify 4/6 keys, difficulty, speed, character, and local records remain unchanged. Confirm both tab labels/counts fit one row and the list retains single-finger scrolling. A fresh load must request the release-versioned catalog rather than silently accept an old ten-track list.

## Game Hub navigation regression

`npm test` includes tests/hub.js: exact fixed destination, shared header and pause anchors, native activation, duplicate protection, pageshow reset, and mocked main departure cleanup/pending record ordering. Cleanup mocks do not establish browser audio behavior or Back/forward cache acceptance.

Serve the game and activate Game Hub with Enter from the main menu and by click from pause/results. Verify https://hyangdan2.github.io/GameHub/ in the same tab. From pause, read the unfinished-run warning, verify RESUME still works without exiting, then leave. After browser Back, require either a usable paused run or a fresh menu with no automatic music. Check initial/resume audio preparation interrupted by navigation. Inspect 390×844 portrait and 844×390 landscape for wrapping, scroll access, visible focus, and targets at least 44px. Finish/save/skip a qualifying record before exiting results and verify records/preferences after return. Hosted game→hub→game acceptance remains separate from localhost→live hub and requires an authorized deployment.
