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
4. Verify D/F/J/K and S/D/F/J/K/L, repeat prevention, two/three-key chords, judgement, health, terminal failure, Free Play recovery, and full results.
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
