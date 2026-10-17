// Optional authoring only: Node 22+, node-web-audio-api 2.2.0, and FFmpeg.
import { writeFile, mkdir, rename } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TRACKS } from "../js/music.js";
import { renderTrack } from "../js/synth.js";
import { encodeWav } from "../js/wav.js";
const track = TRACKS.find((t) => t.id === process.argv[2]);
if (!track)
  throw new Error(
    "Provide one track ID. Run each track in a separate process.",
  );
const { OfflineAudioContext } = await import(
  process.env.AUDIO_RENDERER_MODULE || "node-web-audio-api"
);
const buffer = await renderTrack(track, console.log, OfflineAudioContext);
const directory = new URL("../assets/music/rendered-v3/", import.meta.url);
await mkdir(directory, { recursive: true });
const wav = new URL(`${track.id}.wav`, directory);
await writeFile(wav, new Uint8Array(encodeWav(buffer)));
const output = fileURLToPath(new URL(`${track.id}.mp3`, directory));
const temporary = output + ".tmp.mp3";
const encoded = spawnSync(
  "ffmpeg",
  [
    "-v",
    "error",
    "-y",
    "-i",
    fileURLToPath(wav),
    "-c:a",
    "libmp3lame",
    "-b:a",
    "160k",
    "-write_xing",
    "1",
    temporary,
  ],
  { stdio: "inherit" },
);
if (encoded.status !== 0)
  throw new Error("FFmpeg encoding failed. WAV master remains available.");
await rename(temporary, output);
console.log(
  `Saved ${track.id}: ${buffer.duration}s stereo WAV master and MP3 deployment asset.`,
);
