# Player Guide

[Back to the README](../README.md) · Detailed track, scoring, input, and local-record reference.

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
| Neon Sprint | Electro pop | 150 |
| Prism Circuit | Arcade synth | 156 |
| Moonlit Drive | Melodic dance | 160 |
| Gravity Bloom | Future bass | 164 |
| Chrome Hearts | Electro groove | 168 |
| Starlight Breaker | Breakbeat | 172 |
| Aurora Overload | Uplifting trance | 176 |
| Comet Collision | Drum and bass | 180 |
| Hypernova Protocol | Hard dance | 184 |
| Event Horizon | Cosmic finale | 190 |

The challenge collection adds ten faster arrangements with seeded pattern variation. Selection prefetches a saved MP3; Start decodes it and begins the count-in. Gameplay never synthesizes the soundtrack. Only the current decoded song is cached; retries and difficulty changes reuse it. Failed loads show a retry message. Twenty deployment MP3s total approximately 48 MB. WAV masters and the separate authoring procedure are documented in the [soundtrack guide](../assets/music/README.md).

## Controls and difficulty

4 keys: D F J K. 6 keys: S D F J K L. Escape pauses and resumes. Window blur/hidden state pauses automatically. STANDARD ends at zero health; FREE PLAY continues and can recover. Health starts at 100 and is capped at 100. PERFECT heals +2 and GOOD heals +1 on every difficulty. MISS damage is EASY −8, NORMAL −10, HARD −12, EXPERT −15. Start uses 3/2/1/GO; resume uses 2/1/GO, scheduled on the audio clock.

Difficulty has shifted upward: EASY follows the former NORMAL density; NORMAL follows former HARD; HARD follows former EXPERT; EXPERT adds more sixteenth-note fills and HOLD notes. All difficulties have at most two-note chords in both 4-key and 6-key modes. Chart revision 6 separates single-penalty HOLD scores from earlier records. Previous records remain stored and exportable.

### HOLD rules

Press the HOLD start on time and keep the same key or finger on the same lane until END. The start uses normal PERFECT/GOOD/MISS timing. Later checkpoints automatically score PERFECT at their audio-clock targets while the hold is intact. END does not require a timed release; release at or after END. Moving to another lane, lifting, cancellation, or replacing the original input source permanently breaks that HOLD. Failure immediately removes the entire HOLD, counts one MISS and one HP penalty, and resets combo. Unresolved targets are forfeited without more penalties; earned points remain. Every checkpoint remains in the maximum-score denominator. Repressing cannot repair a failed HOLD.

HOLDs may accompany one TAP on another lane, allowing two simultaneous inputs in both 4/6-key modes. No overlapping HOLDs, same-lane TAPs, or two simultaneous companion TAPs are permitted. On pause, intact HOLDs are suspended without damage. Re-hold the indicated lane/key during the resume countdown; missing that re-hold breaks the HOLD. A HOLD already broken before pause stays broken. EASY and NORMAL remain TAP-only. SIGNAL 1 HARD is TAP-only; SIGNAL 2 HARD also includes HOLDs.

### Speed and scoring

Scroll speed ranges from 0.5× to 10× in 0.25 steps, using either slider or numeric entry. It changes approach time only; music tempo, windows, and scores are unchanged. At 10× the visible approach is approximately 180ms. Settings apply speed immediately while paused and persist locally.

PERFECT <=50ms: 1000 points. GOOD <=120ms: 500. MISS <=180ms: zero and combo reset. Unplayed points expire after 180ms. The nearest unresolved same-lane point is selected; empty inputs have no penalty. Accuracy is score / (all TAPs and HOLD checkpoints × 1000). Grades are S >=95%, A >=90%, B >=80%, C >=70%, otherwise D. Failed runs receive no completion grade.

## High scores

Each track/key mode/difficulty/play mode/chart revision has a local top ten. The board key also fingerprints note data and chart offset, so changed charts cannot silently share old scores. Scroll speed is not a ranking category.

Only completed runs qualify. A strictly new first-place score opens a name prompt, prefilled with the last name. Names are limited to 12 characters. Save, or Skip/Escape to use PLAYER. Other qualifying top-ten runs use the last name. Ties keep existing entries ahead and do not trigger a record prompt. Every run has an ID to prevent duplicate storage. Records show score, accuracy, maximum combo, and date; the menu and result screen expose the relevant board.

Records live only in this browser's localStorage, are not shared between devices, and are not cheat-resistant. Storage failure keeps the record for the current session and displays a message. Invalid stored rows are filtered. No server or database is used.

## Presentation and audio settings

Master, Music, and SFX volume are independent. Result melodies vary by grade/failure. Local calibration offers twelve clicks; tap SPACE after two warm-up beats to estimate combined device/reaction delay. Positive input offset compensates late input and applies next run.

The selected character's nine local expressions react to judgement, health, countdown, and outcome. Character visibility, reduced motion, and effect quality are supported. Audio analysis drives bass pulse, rotating galaxy, and treble stars. See [character provenance](../assets/characters/README.md) for the original asset and generation prompt. Mobile touch controls and a compact play layout are supported; see the touch controls section below.

## Local record backups

SETTINGS → LOCAL RECORDS → EXPORT RECORDS downloads a versioned JSON backup. IMPORT RECORDS merges a backup into this browser's boards. Each board keeps its top ten; duplicate run IDs are skipped, existing equal scores stay ahead, and malformed files are rejected before mutation. Files are limited to 2 MB and 2,000 records. Unknown chart revisions remain separate. Import does not alter your preferred player name or gameplay settings.

Records are personal, not an online ranking. Clearing browser data removes them. Back up before moving from localhost to GitHub Pages, then import on the destination site. Storage is scoped to the browser origin (scheme, host, port), not the repository path: renaming a repository on the same GitHub Pages domain does not itself create a separate storage area. Other projects on that domain using the same storage key can share that area. If persistence fails, records remain in memory for the session and can still be exported.

## Mobile and touch controls

SETTINGS → INPUT MODE offers AUTO (default), TOUCH, and KEYBOARD. AUTO enables lane touch when maxTouchPoints or a coarse pointer indicates touch capability. TOUCH forces lane touch on; KEYBOARD hides touch controls. Physical keyboard input remains available in every mode. This is capability detection, not a claim to identify the device model. The choice is saved locally.

Tap anywhere inside the relevant lane as its note reaches the judgement line; you do not need to touch the moving note. Numbered buttons are hidden in touch mode. Vertical movement within a lane does not create another hit. Four-key and six-key layouts support independent simultaneous pointers. Two fingers on the same lane count as one held lane, and releasing one cannot release another finger or keyboard source. Pointer cancellation and capture loss release the associated source.

For HOLD notes, keep the original finger on the starting lane until END. Use a second finger for companion TAPs in other lanes. Sliding to another lane or leaving the canvas breaks the HOLD; returning or switching fingers cannot repair it. Re-hold an intact HOLD during the resume countdown. There is no release grace for HOLDs on touch or keyboard.

On touch-capable compact viewports (width up to 900 px or height up to 600 px), play uses a viewport-height 75:25 layout. The upper 75% contains the short title/pause bar, progress bar, and touch highway. The lower 25% shows health, score, accuracy, combo, and the selected reactive character. This lower information area does not accept lane input. Decorative headings and long instructions are hidden during play. Safe-area padding and visual viewport height keep the judgement line above device UI. Menus, settings, and results remain scrollable. Rotation that changes width pauses touch play; resume after adjusting your grip. Desktop layout stays unchanged outside compact touch environments.

Run `node tests/touch.js` for simulated input and capability checks. Real iOS Safari/Android Chrome multi-touch, audio latency, safe areas, and browser chrome changes still require device acceptance; automated pointer tests are not physical-device verification.

On mobile, CSS touch-action and gesture fallbacks suppress page pinch and double-tap zoom across menus, settings, results, and play. Single-finger vertical menu/dialog scrolling remains available; play keeps its separate multi-touch input and scroll guard. Form fields use at least 16px text to avoid focus enlargement. Desktop mouse environments retain their existing behavior. Browser/OS accessibility zoom may override page restrictions.

Health uses decimal tenths internally (rounded after each update), with an integer HUD display. Without recovery, EASY/NORMAL/HARD/EXPERT fail after 13/10/9/7 misses respectively. Each TAP applies its own health change; a failed HOLD applies one penalty for the entire group. Successful HOLD checkpoints retain recovery. FREE PLAY continues at zero and still recovers on PERFECT and GOOD. Older records remain stored under their original chart identities; revision 6 HOLD records use separate boards.

The mobile 75:25 split uses the available area after safe-area padding. The judgement line moves upward with the shorter highway, away from the system navigation edge. Short landscape screens reduce HUD text and character size. Character visibility settings still apply. This layout does not disable OS back gestures; it separates the lane input area from the bottom edge.

## Character selection

Click the character in the loaded-track strip on the main menu to open the co-pilot selector. Choose LUMI (cyan/lavender space DJ) or NOVA (silver hair, violet eyes, magenta star accents). The selection immediately updates menu, play, and result views and is saved in this browser. Settings → CHANGE CHARACTER provides the same selector while paused or on results. Selection never changes score, health, timing, or record identity.

SHOW CHARACTER remains independent: choosing a character does not override a hidden-character preference. When hidden, the menu still offers a text selection button and settings access. Character previews in the selector remain visible so you can choose. Reduced-motion preferences disable the menu float and reaction bounce; the idle/blink expressions remain available. Mobile play retains the 75:25 split with the selected character in the lower quarter. The compact menu thumbnail appears below START, without adding content above it.

NOVA is an original generated transparent 3×3 sprite sheet. Generation provenance, prompt, and cell order are documented in assets/characters/README.md and assets/characters/nova-prompt.md. All images are bundled locally; no image generation or network service is used during play.

Character sprites use revised padded sheets plus a fixed, clipped frame with a 6% inner gutter. Only the sprite moves during reactions, keeping animation and shadows away from labels. Original images remain in assets/characters as references. See padding-prompts.md and padding-verification.json there for edit provenance and measured cell margins.

### Recovering an enlarged mobile page

START and RESUME check VisualViewport scale before and after audio preparation/activation. If the page is already enlarged or reduced, a recovery dialog asks you to pinch back to the default size or reset browser page zoom. Zoom gestures are temporarily enabled while scale is abnormal. Returning to normal closes the message and refreshes layout; press START/RESUME again. A zoom change during play pauses the run. The app cannot force browser/OS zoom to reset; browsers without VisualViewport cannot provide this scale check.

## Challenge collection (revision 6)

The second ten tracks use faster tempos, seeded lane selection, additional musical offbeats, and varied EXPERT HOLD lengths. HARD also supports HOLDs on these tracks; original tracks retain EXPERT-only HOLDs. Generated patterns are stored in JSON and never reshuffled during play or retry. Every sustained window still requires at most two fingers. The seed, lane mode, and difficulty determine each pattern; spacing filters reject unsafe repeated lanes. A failed HOLD counts as one MISS even when several checkpoint points are forfeited, so judgement totals may be lower than the maximum-score target count. The persistent EXPERT HOLDS help paragraph has been removed from the play screen.

## Signal collections

TRACK SELECT has two keyboard-accessible tabs: SIGNAL 1 / ORIGINAL contains the first ten tracks; SIGNAL 2 / CHALLENGE contains the ten faster tracks. Each tab shows its track count and retains an independently remembered song. The active signal and both songs persist with existing settings. Legacy preferences infer the signal from the saved track. Key mode, difficulty, speed, character, play mode, chart versions, and local records are unchanged. Arrow keys, Home, and End switch the tabs. Both tabs stay in one row on mobile; the song list scrolls vertically.

The catalog is fetched with a release query and cache revalidation. An incomplete ten-track catalog produces an explicit reload message instead of silently hiding SIGNAL 2. Previously open pages must reload to obtain the updated entry script.
