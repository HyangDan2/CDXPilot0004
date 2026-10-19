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

## Full-lane touch and health update — 2026-10-18

Touch now targets game-canvas instead of numbered controls. Touch labels are hidden and compact canvas layout uses the reclaimed height. Added scoped mobile-play gesture prevention and difficulty-specific health rules (EASY +0.5/−8, NORMAL +0.4/−10, HARD +0.3/−12, EXPERT +0.2/−15; GOOD zero). Free Play remains nonterminal at zero.

Expanded automated checks cover upper/lower canvas coordinates, gesture guards active/inactive/disposed, decimal recovery, neutral GOOD, repeated hits, consecutive/intermittent misses, chords, ribbon checkpoint loss, caps, and Free Play. Real-device pinch/double-tap behavior, perceived touch timing, and the expanded layout remain unverified. No new browser/device acceptance is claimed.

## Recovery correction verification — 2026-10-18

Restored PERFECT +2 and GOOD +1 at every difficulty; tiered MISS damage remains unchanged. Updated current README/architecture/harness contracts. `node tests/health-balance.js` and `node tests/expansion.js` passed, covering recovery, caps, duplicate prevention, all four failure thresholds, intermittent errors, chords, ribbon damage, and Free Play. This supersedes the reduced-recovery values in the earlier update record.

## Mobile lower HUD update — 2026-10-18

Changed compact play to an upper 75% game / lower 25% character-and-information grid. Restored the existing reactive Lumi in the mobile lower panel, honoring character visibility. Health, score, accuracy, and combo occupy the lower row; no duplicate UI state was introduced. Desktop rules and scoped zoom/scroll prevention remain in place.

Touch tests passed for rejecting taps in the area below the canvas and releasing a captured pointer dragged into it. Existing gesture guard and multi-touch tests passed. Both repository-subpath HTTP checks passed for 130 pages/assets. Actual CSS geometry, character presentation, browser zoom handling, and system navigation edges remain unverified on a physical device.

## Character selection update — 2026-10-18

Generated NOVA with the built-in image_gen tool, copied it into assets/characters/nova-expressions.png, and visually inspected the returned full sheet. PNG metadata confirms 1254×1254 RGBA with equal 418-pixel grid cells. Full prompt is saved in assets/characters/nova-prompt.md. No browser runtime image generation is used.

Implemented main-menu thumbnail/selector, settings access, persisted LUMI/NOVA choice, and shared selection on menu/play/results. Existing SHOW CHARACTER, reduced motion, and mobile 75:25 rules are retained. Character tests passed for nine expressions across three simulated views, image grids, selection/visibility persistence, invalid/legacy preference fallback, and storage failure. Repository-subpath checks include both images.

Actual browser selection dialog, focus, sprite cropping, mobile menu size, and live reactions remain unverified. The generated sheet inspection and automated tests are not browser acceptance.

## Sprite isolation update — 2026-10-18

Edited both original atlases with built-in image_gen and saved padded sibling files without modifying the originals. Visually inspected the returned sheets. All eighteen active cells passed the FFmpeg alpha >32 boundary check (minimum substantial-art margin: LUMI 3 px, NOVA 13 px). Faint glow/noise below that threshold is not counted; source margins remain uneven. Full measurements and prompts are saved in assets/characters/padding-verification.json and padding-prompts.md.

Added a fixed clipped frame and separate 10%-inset sprite child to all Mascot views and selection previews. Sheet cropping, reduced shadows, and smaller percentage-based animations now belong to the child. The full npm test suite passed; main syntax and DOM references passed. Character tests verify frame/child ownership, expressions, visibility, selection, and preview reuse. Actual browser/device layout, animation clipping, and small-size readability remain unverified; image inspection and alpha analysis do not establish live UI acceptance.

## Mobile result frame correction — 2026-10-19

The supplied phone screenshot exposed a mobile CSS override that made the result Mascot frame static. Its absolute sprite child therefore used the larger results section as its containing block. Restored a relative 140×140 frame with reset insets and normal-flow margins; reduced the mobile result heading size. Desktop positioning is unchanged.

Passed `node tests/characters.js`, `node tests/pages-paths.js` (135 exact-case pages/assets under both repository prefixes), and the ES-module syntax check for tests/result-layout.js. Added a browser geometry fixture for both characters, clear/fail headings, visibility, and four viewport sizes. That fixture has not been executed; live Safari and physical iPhone layout remain unverified. The existing browser access restriction was respected. No deployment was performed.

## Compact combo clipping correction — 2026-10-19

Source inspection found a max-width:900px rule forcing combo text to 45px with !important, overriding the compact 15px/12px rules inside a 20px grid row. Removed that priority override while preserving the general sidebar's 45px size through selector specificity. Added an explicit 20px compact line height, normal letter spacing, and no wrapping.

Passed touch simulations, repository-prefix checks (137 pages/assets), mobile-hud.js ES-module syntax, and git diff whitespace checks. Added tests/mobile-hud.html for viewport geometry and five-digit combo coverage. The browser fixture and real phone display have not been executed or verified; existing browser access restrictions remain respected. No commit, push, or deployment was performed for this correction.

## Revision 4 ribbons and two-note chords — 2026-10-19

Implemented per-gesture touch identity and source-release tracking. Touch links require actual same-gesture lane movement without lifting/cancellation/exit; keyboard retains hold transitions and 80ms grace. Resume explicitly binds a held same-kind source. Existing aggregate input ownership, per-checkpoint MISS/health, Free Play, and timed recovery are retained.

Regenerated all 80 charts as revision 4. Compared generated files against HEAD: only the 20 six-key HARD/EXPERT note arrays changed; four-key patterns, other difficulties, and audio remain unchanged. All difficulties/modes now cap chords at two, and validation rejects competing notes throughout each ribbon window. Existing records are preserved with independent revision-4 boards; backup schema is unchanged.

The full npm test suite passed after the new regressions were added. Checks include 80 keyboard and source-aware touch full replays, 4/6-lane pointer lifecycles (including lift/re-touch within 80ms), different-finger rejection, cancellation/capture loss/exit, recovery, missed checkpoint damage, resume, keyboard grace boundaries, triple-chord rejection, and old/new leaderboard persistence. Re-ran library tests after adding final-touch release cleanup; main/game syntax and git diff whitespace checks passed. No failed checks remain. Earlier compact COMBO styling and its browser fixture are included in this update.

These are logic/simulated-event and static-asset checks. Actual mobile touch hardware, Safari rendering, the mobile HUD browser fixture, and deployed Pages behavior remain unverified. Existing browser access restrictions were respected. No audio rendering or listening test was necessary or performed for this change.

## Mobile page-wide zoom and recovery — 2026-10-19

Added mobile-wide pan-y styling and zoom-only gesture fallbacks across menus/dialogs/results, retaining the separate play scroll guard and pointer input. Mobile form fields use 16px text. Primary coarse-pointer detection includes landscape tablets; ordinary desktop mouse environments remain unchanged. Added a recovery dialog and entry/resume gates before and after asynchronous audio work. Active-play scale changes pause the run; recovery restores layout without automatically resuming. Abnormal scale does not replace the last normal play height.

Passed the full npm test suite, including the new tests/viewport.js simulated gesture and scale-gate checks, existing 4/6-pointer and source-aware ribbon tests, all-chart replays, and both repository-subpath HTTP checks (139 pages/assets). Main/viewport ES-module syntax and git diff whitespace checks passed. No failing automated checks remain.

Actual iOS Safari/Android Chrome pinch, double-tap, native scrolling, form focus, and recovery dialogs remain unverified on physical devices or in a live browser. Existing browser access restrictions were respected. The gate tests simulate asynchronous scheduling boundaries; they do not execute the production UI or prove physical gesture cancellation. Browser/OS zoom overrides cannot be forcibly reset, and scale detection requires VisualViewport. No scoring/chart/audio or record migration was introduced. Follow-up: perform the device acceptance checklist in HARNESS.md after publication.

## Same-lane HOLD update — 2026-10-19

Converted catalog EXPERT slides to stationary HOLDs with HOLD/KEEP/END rendering and original-source tracking on touch/keyboard. Maintained the original three checkpoint times and added one off-lane companion TAP at the later musical cues. Early release, lane movement, or cancellation permanently breaks remaining checkpoints; repressing does not recover. Intact holds can rebind during resume, while previously broken holds remain broken. Maintenance/end judgement uses audio time; exact END release succeeds.

Regenerated all 80 charts as revision 5 to separate scores without removing previous records. Audio is unchanged. The all-library suite passed full keyboard and source-aware touch replays, onset mapping, spacing, no catalog drag notes, and sustained occupancy of at most one HOLD plus one TAP. The full npm suite passed after implementation. Added tests/holds.js for both input kinds, original-source cancellation even with another finger held, companion TAPs in 4/6 lanes, failed-start/no-recovery, exact-END/delayed-frame handling, input offsets, resume state, Free Play/terminal freeze, validator rejection, and old-record preservation.

Actual browser rendering, physical mobile HOLD interaction, and deployed Pages behavior remain unverified under the existing browser access restriction. The browser audit page was updated for HOLD scheduling but was not executed. No physical audio-sync or edge-navigation prevention claim is made; stationary notes remove the required sideways gesture but cannot disable system navigation.

Final revision audit against the prior commit confirmed exactly 20 EXPERT chart note arrays changed, 144 HOLD groups retained their previous checkpoint times, and all 60 non-EXPERT note arrays plus audio paths remained identical. Re-ran the full suite after keyboard companion-input coverage; all checks passed, including 140 exact-case assets/pages under both repository prefixes. Main/browser-audit syntax and whitespace checks passed. No outstanding automated failures remain.

## Sharing previews and icons — 2026-10-19

Added static description/canonical/Open Graph/large-card metadata, a local 1200×630 LUMI/NOVA neon sharing card, SVG/PNG/multi-size ICO favicons, and a 180px Apple icon. Visually inspected generated character/title artwork and the final icon export. The first ImageMagick SVG rasterization omitted strokes and was replaced with verified Sharp/librsvg raster exports before generating ICO sizes. Original character sheets are unchanged; prompts/provenance are recorded in assets/branding.

Passed the full npm test suite, including metadata consistency, public Pages prefix, PNG dimensions/signature/size budget, icon dimensions/formats, and HTTP 200 plus branding MIME checks under both repository prefixes (146 pages/assets). Whitespace checks passed. The existing public Pages root returned HTTP 200 before this change was pushed. No automated failures remain.

Actual social-service preview refresh and browser tab/home-screen rendering remain unverified. No messages were sent to any recipient. HTTP/source checks do not establish social-card rendering, and platform caches may retain the previous preview after publication. The public metadata URLs must be updated if the repository/domain changes.

## Sharing card anatomy correction — 2026-10-19

Replaced the active social card URL with share-card-v2.png, retaining v1. The first edited draft had six NOVA digits and was rejected. Visually inspected the targeted correction and counted five visible digits on each foreground hand. Resized to 1200×630 and updated both social image tags. Sharing metadata/dimension tests, both Pages-prefix HTTP asset tests, and whitespace checks passed. Anatomy was visually reviewed, not automatically inferred by the tests. Social-service cache refresh remains unverified.

## NOVA hand anatomy redraw — 2026-10-19

The v2 digit count was insufficient: NOVA's fingers were distributed radially around the palm. Redrew the hand and wrist as an upright open-palm wave in v3. Visually checked four top-edge fingers, one side thumb, and a wrist below; preserved LUMI and the composition. Both sharing tags now point to share-card-v3.png. Sharing metadata/dimension checks, both repository-prefix asset checks, and whitespace checks passed. Actual social-cache refresh remains unverified.
