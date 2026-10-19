# Contributor Rules

## Scope and language
- Write source, comments, UI, documentation, and test output in English.
- Current scope: ten two-minute Web Audio tracks, 80 revisioned charts, 4/6 keys, four difficulties including EXPERT, survival/free play, audio-clock countdowns, result SFX, Lumi reactions, 0.5–10× scroll speed, named local leaderboards, EXPERT same-lane HOLD notes, calibration, and audio-reactive cosmic effects. Deployment is not authorized.
- Use buildless HTML, CSS, vanilla JavaScript ES modules, Canvas 2D, and Web Audio.
- No frameworks, game engines, CDN dependencies, backend, database, accounts, Python runtime, webcam, or music-generation API.

## Required workflow
1. Read this file, [architecture](docs/ARCHITECTURE.md), and [harness](docs/HARNESS.md).
2. Inspect existing files and working changes. Preserve user changes and avoid unrelated rewrites.
3. Identify the owning module and affected behavior before editing.
4. Make the smallest coherent change. Avoid circular imports and hidden shared state.
5. Run relevant harness checks. Add regression coverage for substantive logic fixes.
6. Update contracts and [decisions](docs/DECISIONS.md) when interfaces change.
7. Report implementation, checks actually run, failures, unverified behavior, and follow-up work separately.

## Invariants
- Audio time is authoritative. Animation frames sample it; they never accumulate song time.
- Game alone mutates gameplay state. Renderer and Particles cannot score or move chart targets.
- A note is judged once. Expired notes resolve before a new input is scored.
- Each chart specifies lanes. Mode configuration owns bindings and colors; never hardcode four lanes in consumers.
- Scroll speed changes only travel distance and approach time, never music or judgement timing.
- Different difficulties and modes share the same track audio. Do not synthesize a different song per chart.
- Scores and cues originate from music.js; synth.js renders instruments with OfflineAudioContext during authoring only. Regenerate JSON with scripts/generate-library.mjs after score/chart changes. Production loads saved local MP3 assets; it must never render catalog songs.
- Chart changes must pass all-library validation, including onset alignment, spacing, chord limits, and full replays.
- Stop/disconnect replaced audio sources and clear held keys and effects on transitions.
- Cap/reuse particles. Respect reduced motion and retain a low-quality option.
- Persist only local preferences, with validation and graceful storage failure.
- Distinguish mocked tests, PCM analysis, real browser measurements, and physical listening tests. Never claim device synchronization from logic tests alone.
- Browser access denial must not be bypassed with an alternate automation surface.

## Survival and presentation contracts
- Game alone owns health and terminal failure. Never process remaining notes after standard-mode failure. Free Play must continue at zero health.
- Countdown is sampled from AudioContext; schedule the source and GO tone at the same deadline. Never use a timeout to start music.
- Pause/cancel/retry must stop future scheduled sources and all SFX voices. Song position stays frozen during count-in.
- Result handling is idempotent: one screen transition and one SFX sequence per run.
- Master, music, and SFX volumes use separate gain stages. Analyser reads music only.
- Mascot consumes feedback events; it cannot mutate Game. Keep sheet assets local and document prompt/provenance.
- All difficulties support at most two-note chords in both 4-key and 6-key modes. Generated same-lane spacing floors are 80ms for HARD/EXPERT and 160ms for EASY/NORMAL.

## Ribbons, records, and synthesis
- Only EXPERT may contain HOLD checkpoints. Validate contiguous order, increasing times, and one fixed lane. A HOLD counts as one occupied input throughout its duration; allow only one off-lane companion TAP, no overlapping HOLDs, and no same-lane TAPs.
- Track the original HOLD source. Any early release/cancel/lane exit permanently breaks the group; no re-touch recovery or release grace. Automatic checkpoints sample audio time. Intact holds may rebind during resume countdown; already broken holds must remain broken.
- Count every TAP and HOLD checkpoint once in maximum score. Preserve Free Play recovery and terminal STANDARD freeze.
- Version charts and fingerprint notes for leaderboards. Never mix modes or chart revisions. Tie scores keep earlier rows ahead.
- Save only completed runs; use per-run IDs to prevent duplicate saves. Names are bounded and rendered with textContent. Handle unavailable storage without blocking gameplay.
- Production keeps one decoded song and one selected download. Authoring renders ten-second cores with four-second warm-up and provides progress. Never claim a mock graph test verifies actual sound, render speed, or browser memory.

## Touch contracts
- Aggregate keyboard and pointer sources; release a lane only after its final source releases.
- Pointer cancellation, capture loss, pause, and mode changes must clear held/captured state.
- Movement must never judge TAP or HOLD starts. Production uses stationary HOLDs instead of slide notes.
- Touch HOLDs require one uninterrupted stationary-lane gesture; keyboard HOLDs require the same key. Track source releases independently from aggregated lane holds; explicitly rebind intact holds during resume count-in.
- AUTO uses capabilities, not user-agent model guesses. Respect explicit input mode while retaining keyboard support.
- Compact play must fit the visual viewport and safe areas. Keep menus/settings scrollable and desktop layout unchanged.
- Distinguish simulated multi-touch tests from real device/browser acceptance.

## Character catalog
- Register local skins in characters.js with the shared nine-cell expression order. Document generated asset prompts/provenance.
- Keep characterId separate from visibility; selection must not re-enable hidden characters or alter gameplay/records.
- Synchronize menu/play/result views and preserve reduced motion and mobile HUD sizing.

## Mobile viewport contract
- Suppress mobile page zoom across screens while preserving menu/dialog vertical scrolling and game pointer input. Do not globally cancel touchstart or pointer events.
- Gate start/resume on normal VisualViewport scale before and after async preparation. Pause on zoom during play; never auto-resume after recovery. Keep zoom recovery gestures available and never claim a guaranteed programmatic browser/OS zoom reset.
