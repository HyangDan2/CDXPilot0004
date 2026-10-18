# Particle Beat — Volume 03

A buildless desktop rhythm game with ten original two-minute Web Audio compositions, 80 versioned charts, 4/6 keys, four difficulty tiers, EXPERT keyboard ribbons, local named records, and a reactive cosmic stage with selectable LUMI and NOVA.

## Run

```sh
node scripts/serve.mjs
```

Open http://127.0.0.1:8765/. Node.js 22+ is recommended for the optional server. Any static HTTP server works; no install or build is required. Do not use file://. Runtime requires a browser with AudioContext. Bundled audio files load from the same static server. No external services, Python, accounts, or API keys are required. No deployment has been performed.

## Collection

Every composition lasts 120 seconds. Audio is pre-rendered during authoring from oscillators, filters, noise, envelopes, stereo panning, delay, and distortion. There are no lyrics, real singers, borrowed melodies, or cloned voices. Each mode/difficulty shares the same soundtrack.

| Track | Style | BPM |
| --- | --- | --- |
| Neon Galaxy | Celestial synthwave | 124 |
| Violet Drift | Orbital downtempo | 100 |
| Solar Rush | Solar electro | 140 |
| Deep Orbit | Deep space house | 112 |
| Starlight Engine | Prismatic trance | 132 |
| Pixel Sunrise | Formant electropop | 168 |
| Velvet Satellite | Dream dance pop | 118 |
| Chrome Heart | Millennium dance pop | 104 |
| Comet Riot | Synth guitar rock | 156 |
| Rainfall Circuit | Piano drum and bass | 172 |

The five new tracks use distinct instruments and arrangements. Selection prefetches a saved MP3; Start decodes it and begins the count-in. Gameplay never synthesizes the soundtrack. Only the current decoded song is cached; retries and difficulty changes reuse it. Failed loads show a retry message. Ten deployment MP3s total approximately 24 MB. WAV masters and the separate authoring procedure are documented in assets/music/README.md.

## Controls and difficulty

4 keys: D F J K. 6 keys: S D F J K L. Escape pauses and resumes. Window blur/hidden state pauses automatically. STANDARD ends at zero health; FREE PLAY continues and can recover. Health starts at 100 and is capped at 100. PERFECT heals +2 and GOOD heals +1 on every difficulty. MISS damage is EASY −8, NORMAL −10, HARD −12, EXPERT −15. Start uses 3/2/1/GO; resume uses 2/1/GO, scheduled on the audio clock.

Difficulty has shifted upward: EASY follows the former NORMAL density; NORMAL follows former HARD; HARD follows former EXPERT; EXPERT adds more sixteenth-note fills and keyboard ribbons. HARD/EXPERT have at most two-note chords in 4-key mode and three-note chords in 6-key mode. Chart revision 3 separates new records from earlier data.

### EXPERT ribbons

A connected neon ribbon joins HOLD, directional checkpoints, and END. Press the first key on time and keep it held. Press the adjacent key at the next checkpoint, then release the previous key. Short overlaps are allowed. Releasing the previous key up to 80ms before the next hit is allowed; an earlier release breaks that link even if you re-press just before the checkpoint. Every checkpoint scores once, using the same judgement/health rules as TAP notes. A missed checkpoint can be followed by a successful recovery; a timed input re-anchors the chain.

There are no competing TAPs inside generated ribbon windows. On pause, held-key state is cleared. Re-hold the indicated anchor key during the resume countdown to reconnect. Countdown input cannot score. Release the last key after END. EASY/NORMAL/HARD contain only TAP notes.

### Speed and scoring

Scroll speed ranges from 0.5× to 10× in 0.25 steps, using either slider or numeric entry. It changes approach time only; music tempo, windows, and scores are unchanged. At 10× the visible approach is approximately 180ms. Settings apply speed immediately while paused and persist locally.

PERFECT <=50ms: 1000 points. GOOD <=120ms: 500. MISS <=180ms: zero and combo reset. Unplayed points expire after 180ms. The nearest unresolved same-lane point is selected; empty inputs have no penalty. Accuracy is score / (all TAPs and ribbon checkpoints × 1000). Grades are S >=95%, A >=90%, B >=80%, C >=70%, otherwise D. Failed runs receive no completion grade.

## High scores

Each track/key mode/difficulty/play mode/chart revision has a local top ten. The board key also fingerprints note data and chart offset, so changed charts cannot silently share old scores. Scroll speed is not a ranking category.

Only completed runs qualify. A strictly new first-place score opens a name prompt, prefilled with the last name. Names are limited to 12 characters. Save, or Skip/Escape to use PLAYER. Other qualifying top-ten runs use the last name. Ties keep existing entries ahead and do not trigger a record prompt. Every run has an ID to prevent duplicate storage. Records show score, accuracy, maximum combo, and date; the menu and result screen expose the relevant board.

Records live only in this browser's localStorage, are not shared between devices, and are not cheat-resistant. Storage failure keeps the record for the current session and displays a message. Invalid stored rows are filtered. No server or database is used.

## Presentation and audio settings

Master, Music, and SFX volume are independent. Result melodies vary by grade/failure. Local calibration offers twelve clicks; tap SPACE after two warm-up beats to estimate combined device/reaction delay. Positive input offset compensates late input and applies next run.

The selected character's nine local expressions react to judgement, health, countdown, and outcome. Character visibility, reduced motion, and effect quality are supported. Audio analysis drives bass pulse, rotating galaxy, and treble stars. See assets/characters/README.md for the original asset and generation prompt. Mobile touch controls and a compact play layout are supported; see the touch controls section below.

## Authoring and checks

Edit `js/music.js` for compositions, cue placement, and lane patterns; `js/synth.js` owns instrument graphs. Regenerate JSON only:

```sh
node scripts/generate-library.mjs
npm test
```

Generation writes ten catalog entries and 80 JSON charts; saved audio is generated separately using tools/render-audio.html or scripts/render-audio.mjs (see assets/music/README.md). A drag checkpoint uses `{time, lane, type: "drag", group, step}` with contiguous steps, strictly increasing times, and adjacent lanes. Only EXPERT allows this type. Keep competing notes outside each ribbon window plus 180ms margin. All charts carry a version.

Browser logic checks: `/tests/`. Real-time audio/input/render audit: `/tests/browser.html`. The latter uses synthetic input in Free Play; it cannot verify physical keyboard rollover or perceived audio latency. See docs/VERIFICATION.md for what was actually executed.

Contributor guide: AGENTS.md. Ownership and timing: docs/ARCHITECTURE.md. Test workflow: docs/HARNESS.md. Design history: docs/DECISIONS.md. All maintained files are in English.

## Local record backups

SETTINGS → LOCAL RECORDS → EXPORT RECORDS downloads a versioned JSON backup. IMPORT RECORDS merges a backup into this browser's boards. Each board keeps its top ten; duplicate run IDs are skipped, existing equal scores stay ahead, and malformed files are rejected before mutation. Files are limited to 2 MB and 2,000 records. Unknown chart revisions remain separate. Import does not alter your preferred player name or gameplay settings.

Records are personal, not an online ranking. Clearing browser data removes them. Back up before moving from localhost to GitHub Pages, then import on the destination site. Storage is scoped to the browser origin (scheme, host, port), not the repository path: renaming a repository on the same GitHub Pages domain does not itself create a separate storage area. Other projects on that domain using the same storage key can share that area. If persistence fails, records remain in memory for the session and can still be exported.

## GitHub Pages readiness

The repository can remain named `CDXPilot0004`. The expected project address is `https://<account>.github.io/CDXPilot0004/`. No source code contains that repository name as a runtime base path. HTML/CSS/module references are relative, and audio URLs resolve against the module's project root. The root `.nojekyll` file marks this as a static site.

When ready to publish, push the project files (including MP3s, charts, artwork, and `.nojekyll`) and open the repository's Settings → Pages. Choose **Deploy from a branch**, the intended branch, and **/(root)**, then Save. Do not select `/docs`, which contains documentation rather than the game. See [GitHub's publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). This task has not enabled Pages or published the repository.

Reproduce a project subpath locally:

```sh
BASE_PATH=/CDXPilot0004 PORT=8766 node scripts/serve.mjs
```

Open `http://127.0.0.1:8766/CDXPilot0004/`. `node tests/pages-paths.js` checks exact filename case and HTTP availability under both the current name and an alternative name, including ten MP3s and eighty charts. It is a static asset/HTTP check, not browser gameplay verification. After publication, verify the real site, audio activation, refresh, settings, and backup import/export in the target browser.

## Mobile and touch controls

SETTINGS → INPUT MODE offers AUTO (default), TOUCH, and KEYBOARD. AUTO enables lane touch when maxTouchPoints or a coarse pointer indicates touch capability. TOUCH forces lane touch on; KEYBOARD hides touch controls. Physical keyboard input remains available in every mode. This is capability detection, not a claim to identify the device model. The choice is saved locally.

Tap anywhere inside the relevant lane as its note reaches the judgement line; you do not need to touch the moving note. Numbered buttons are hidden in touch mode. Vertical movement within a lane does not create another hit. Four-key and six-key layouts support independent simultaneous pointers. Two fingers on the same lane count as one held lane, and releasing one cannot release another finger or keyboard source. Pointer cancellation and capture loss release the associated source.

For EXPERT ribbons, hold the starting lane, slide into its neighboring lane at the next checkpoint, and lift after END. Crossing a boundary is one input, not automatic play: moving too early or too late does not wait for a note. Sliding never scores ordinary TAP notes; lift and tap those. Existing windows, health, scoring, and 80 ms ribbon grace apply. Hold the indicated lane again during a resume countdown. Leaving the canvas releases that hold.

On touch-capable compact viewports (width up to 900 px or height up to 600 px), play uses a viewport-height 75:25 layout. The upper 75% contains the short title/pause bar, progress bar, and touch highway. The lower 25% shows health, score, accuracy, combo, and the reactive Lumi character. This lower information area does not accept lane input. Decorative headings and long instructions are hidden during play. Safe-area padding and visual viewport height keep the judgement line above device UI. Menus, settings, and results remain scrollable. Rotation that changes width pauses touch play; resume after adjusting your grip. Desktop layout stays unchanged outside compact touch environments.

Run `node tests/touch.js` for simulated input and capability checks. Real iOS Safari/Android Chrome multi-touch, audio latency, safe areas, and browser chrome changes still require device acceptance; automated pointer tests are not physical-device verification.

During compact mobile play, CSS touch-action and scoped gesture handlers suppress pinch, double-tap/double-click zoom, and touch scrolling. These handlers are inactive outside play or while a dialog is open. Browser/OS accessibility zoom may override page restrictions and requires real-device verification.

Health uses decimal tenths internally (rounded after each update), with an integer HUD display. Without recovery, EASY/NORMAL/HARD/EXPERT fail after 13/10/9/7 misses respectively. Each simultaneous note and ribbon checkpoint applies its own health change. FREE PLAY continues at zero and still recovers on PERFECT and GOOD. Charts, timing windows, scores, and existing records remain unchanged; older records may have been earned under the previous survival rules.

The mobile 75:25 split uses the available area after safe-area padding. The judgement line moves upward with the shorter highway, away from the system navigation edge. Short landscape screens reduce HUD text and character size. Character visibility settings still apply. This layout does not disable OS back gestures; it separates the lane input area from the bottom edge.

## Character selection

Click the character in the loaded-track strip on the main menu to open the co-pilot selector. Choose LUMI (cyan/lavender space DJ) or NOVA (silver hair, violet eyes, magenta star accents). The selection immediately updates menu, play, and result views and is saved in this browser. Settings → CHANGE CHARACTER provides the same selector while paused or on results. Selection never changes score, health, timing, or record identity.

SHOW CHARACTER remains independent: choosing a character does not override a hidden-character preference. When hidden, the menu still offers a text selection button and settings access. Character previews in the selector remain visible so you can choose. Reduced-motion preferences disable the menu float and reaction bounce; the idle/blink expressions remain available. Mobile play retains the 75:25 split with the selected character in the lower quarter. The compact menu thumbnail appears below START, without adding content above it.

NOVA is an original generated transparent 3×3 sprite sheet. Generation provenance, prompt, and cell order are documented in assets/characters/README.md and assets/characters/nova-prompt.md. All images are bundled locally; no image generation or network service is used during play.
