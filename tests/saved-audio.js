import assert from "node:assert/strict";
import { AudioEngine } from "../js/audio.js";
import { TRACKS, makeChart } from "../js/music.js";
import { encodeWav } from "../js/wav.js";
const originalFetch = globalThis.fetch;
const chart = makeChart(TRACKS[0], 4, "easy");
let fetches = 0,
  decodes = 0;
const engine = new AudioEngine();
engine.context = {
  decodeAudioData: async (bytes) => {
    decodes++;
    assert.equal(bytes.byteLength, 8);
    return { duration: 120 };
  },
};
globalThis.fetch = async (url) => {
  fetches++;
  assert(url.href.endsWith(TRACKS[0].audio.slice(2)));
  return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
};
try {
  await engine.prefetch(chart);
  assert.equal(decodes, 0, "Selection does not activate or decode audio");
  await engine.prepare(chart);
  assert.equal(fetches, 1, "Start reuses prefetched bytes");
  assert.equal(decodes, 1);
  await engine.prepare(makeChart(TRACKS[0], 6, "expert"));
  assert.equal(decodes, 1, "Other charts share the decoded song");
  assert.equal(fetches, 1);
  const failed = new AudioEngine();
  failed.context = engine.context;
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await assert.rejects(failed.prepare(chart), /download failed/);
  assert.equal(failed.buffer, null, "No expensive synthesis fallback");
  globalThis.fetch = async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  });
  failed.context = {
    decodeAudioData: async () => {
      throw new Error("Invalid MP3");
    },
  };
  await assert.rejects(failed.prepare(chart), /Unable to decode/);
  failed.context = { decodeAudioData: async () => ({ duration: 122 }) };
  await assert.rejects(failed.prepare(chart), /duration does not match/);
  failed.context = engine.context;
  await failed.prepare(chart);
  assert.equal(failed.buffer.duration, 120, "Retry recovers after failures");
  const bytes = encodeWav({
    numberOfChannels: 2,
    length: 2,
    sampleRate: 32000,
    getChannelData: (c) =>
      c ? new Float32Array([0.5, -0.5]) : new Float32Array([1, -1]),
  });
  const view = new DataView(bytes);
  assert.equal(view.getUint32(40, true), 8);
  assert.equal(view.getInt16(44, true), 32767);
  assert.equal(view.getInt16(48, true), -32768);
  console.log(
    "PASS saved audio: prefetch, cache, modes, failures, retry, duration guard, stereo WAV encoding",
  );
} finally {
  globalThis.fetch = originalFetch;
}
