# Saved Soundtracks

The active catalog uses `rendered-v3/<track-id>.mp3`. All twenty songs are original deterministic Web Audio arrangements from js/music.js and js/synth.js. Playback downloads and decodes these assets; it never renders a song. Historical WAVs in this directory are retained but unused.

## Masters and deployment

`rendered-v3/*.wav` are 120-second, 32 kHz, stereo 16-bit PCM masters. `*.mp3` are 160 kbps deployment copies with Xing gapless metadata. Preserve the beginning of the file: chart time zero equals audio time zero. Do not trim silence or independently normalize sections. The synth applies soft limiting and a three-second fade. All eight charts for a track share one audio file.

## Browser authoring

Open `/tools/render-audio.html`, select a track, and render/download its WAV. This development page can take time but shows window-level progress. Save the master into rendered-v3. Encode with FFmpeg:

```sh
ffmpeg -i assets/music/rendered-v3/neon-galaxy.wav -c:a libmp3lame -b:a 160k -write_xing 1 assets/music/rendered-v3/neon-galaxy.mp3
```

## Optional Node authoring

Requires Node 22+, FFmpeg, and node-web-audio-api 2.2.0 installed in an authoring-only directory. Neither the package nor FFmpeg is needed to run the game. The exact same synth graph runs through the Node implementation of Web Audio, without controlling a browser.

```sh
npm install --prefix /tmp/particle-beat-audio-authoring node-web-audio-api@2.2.0
AUDIO_RENDERER_MODULE=/tmp/particle-beat-audio-authoring/node_modules/node-web-audio-api/index.js node scripts/render-audio.mjs neon-galaxy
```

Repeat for each catalog ID, using a separate process per song. The exporter retains WAV masters and writes MP3 files atomically after successful encoding. Existing historical root WAVs are not overwritten.

Render windows contain ten-second cores and four seconds of warm-up. Warm-up covers all current instrument and echo tails. Samples are assembled without overlap mixing, trimming the core exactly at integer sample boundaries. Changing instruments to longer tails requires extending warm-up and testing joins.

## Verification

Run `node scripts/verify-audio.mjs` (FFmpeg required), `node scripts/generate-library.mjs`, and `npm test`. Check decoded duration, sample alignment, finite signal, segment energy, and peaks. Then listen and run the browser harness; encoded-file checks cannot prove device sync. If score cue timings change, regenerate charts and update chart revision; file-path-only changes preserve existing leaderboard identity.
