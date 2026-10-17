import { readFile, writeFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { TRACKS } from "../js/music.js";
const reports = [];
for (const track of TRACKS) {
  const base = new URL(
    `../assets/music/rendered-v3/${track.id}`,
    import.meta.url,
  );
  const wav = await readFile(new URL(base.href + ".wav"));
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(24), 32000);
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.length, 44 + 120 * 32000 * 4);
  const result = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      fileURLToPath(base) + ".mp3",
      "-f",
      "f32le",
      "-acodec",
      "pcm_f32le",
      "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  assert.equal(result.status, 0, result.stderr.toString());
  const decoded = result.stdout;
  assert.equal(
    decoded.length,
    120 * 32000 * 2 * 4,
    "Gapless decode must retain exact duration",
  );
  let peak = 0,
    energy = 0,
    stereoDifference = 0;
  const segmentRms = [];
  for (let i = 0; i < decoded.length / 4; i++) {
    const value = decoded.readFloatLE(i * 4);
    assert(Number.isFinite(value));
    peak = Math.max(peak, Math.abs(value));
    energy += value * value;
    if (i % 2 === 0)
      stereoDifference += Math.abs(value - decoded.readFloatLE((i + 1) * 4));
    if ((i + 1) % (32000 * 2 * 10) === 0) {
      segmentRms.push(Math.sqrt(energy / (32000 * 2 * 10)));
      energy = 0;
    }
  }
  assert(peak < 1, "Deployment audio must have headroom");
  assert(
    segmentRms.every((rms) => rms > 0.001),
    "Every ten-second section has signal",
  );
  assert(stereoDifference > 1, "Nonidentical stereo channels");
  // Test early and late phase alignment; codec changes may not shift chart zero.
  const alignment = [];
  for (const second of [4, 114]) {
    let bestLag = 0,
      bestCorrelation = -1;
    for (let lag = -64; lag <= 64; lag++) {
      let xy = 0,
        xx = 0,
        yy = 0;
      for (let j = 0; j < 32000; j += 16) {
        const frame = second * 32000 + j;
        const x = wav.readInt16LE(44 + frame * 4) / 32768;
        const y = decoded.readFloatLE((frame + lag) * 8);
        xy += x * y;
        xx += x * x;
        yy += y * y;
      }
      const correlation = xy / Math.sqrt(xx * yy);
      if (correlation > bestCorrelation) {
        bestLag = lag;
        bestCorrelation = correlation;
      }
    }
    assert.equal(bestLag, 0, "Encoding must not shift onsets");
    assert(bestCorrelation > 0.98, "Decoded signal matches master");
    alignment.push({
      second,
      lagSamples: bestLag,
      correlation: bestCorrelation,
    });
  }
  reports.push({
    id: track.id,
    duration: 120,
    sampleRate: 32000,
    channels: 2,
    mp3Bytes: (await stat(new URL(base.href + ".mp3"))).size,
    peak,
    segmentRms,
    alignment,
  });
  console.log(
    `PASS ${track.id}: 120s stereo, signal/headroom, zero-sample codec shift at 4s and 114s`,
  );
}
await writeFile(
  new URL("../assets/music/rendered-v3/verification.json", import.meta.url),
  JSON.stringify({ decoder: "FFmpeg", reports }, null, 2) + "\n",
);
