import { AudioEngine } from "../js/audio.js";
import { Input } from "../js/input.js";
import { Game } from "../js/game.js";
import { validateBeatmap } from "../js/beatmap.js";
import { readFileSync } from "node:fs";
function assert(value, message) {
  if (!value) throw new Error(message);
}
const audio = new AudioEngine();
const sources = [];
audio.context = {
  currentTime: 10,
  sampleRate: 8000,
  createBufferSource() {
    const source = {
      connect() {},
      disconnect() {
        this.disconnected = true;
      },
      start(when, offset) {
        this.offset = offset;
      },
      stop() {
        this.stopped = true;
      },
    };
    sources.push(source);
    return source;
  },
  createBuffer(channels, length, rate) {
    const data = new Float32Array(length);
    return { duration: length / rate, getChannelData: () => data };
  },
};
audio.gain = {};
audio.buffer = { duration: 40 };
audio.play();
audio.context.currentTime = 12.5;
assert(audio.time === 2.5, "Transport must follow context time");
audio.pause();
audio.context.currentTime = 50;
assert(audio.time === 2.5, "Pause must freeze time");
assert(
  sources[0].stopped && sources[0].disconnected,
  "Old source must be cleaned up",
);
audio.play();
assert(sources[1].offset === 2.5, "Resume must seek stored offset");
audio.context.currentTime = 51;
assert(audio.time === 3.5, "Resume timeline must stay continuous");
audio.stop();
assert(audio.time === 0 && !audio.playing, "Stop must reset");
console.log(
  "PASS Audio transport pause, resume, reset, and source cleanup (mock context)",
);
const chart = validateBeatmap(
  JSON.parse(
    readFileSync(new URL("../assets/beatmaps/demo.json", import.meta.url)),
  ),
);
const buffer = audio.synthesize(chart),
  samples = buffer.getChannelData(0);
assert(buffer.duration > chart.notes.at(-1).time, "Audio must cover the chart");
assert(samples.every(Number.isFinite), "Samples must be finite");
assert(
  samples.some((n) => Math.abs(n) > 0.1),
  "Synth must produce a signal",
);
assert(
  samples.every((n) => Math.abs(n) <= 1),
  "Synth must avoid clipping",
);
console.log(
  `PASS Synthesized ${buffer.duration.toFixed(2)}s signal covers ${chart.notes.length} notes`,
);
const g = new Game(chart);
for (const n of chart.notes) g.hit(n.lane, n.time);
g.update(buffer.duration);
assert(
  g.complete &&
    g.score === chart.notes.length * 1000 &&
    g.accuracy === 100 &&
    g.grade === "S",
  "Perfect full-chart simulation",
);
const missed = new Game(chart, 0, "free");
missed.update(buffer.duration);
assert(
  missed.complete &&
    missed.counts.MISS === chart.notes.length &&
    missed.score === 0,
  "No-input full-chart simulation",
);
console.log("PASS Full demo simulation: all-perfect and all-miss results");
const handlers = new Map();
globalThis.window = {
  addEventListener: (type, fn) => handlers.set(type, fn),
  removeEventListener: (type) => handlers.delete(type),
};
const hits = [];
let pauses = 0;
const input = new Input(
  (lane) => hits.push(lane),
  () => pauses++,
);
const event = (code, repeat = false) => ({
  code,
  repeat,
  target: { matches: () => false },
  preventDefault() {},
});
handlers.get("keydown")(event("KeyD"));
handlers.get("keydown")(event("KeyF"));
handlers.get("keydown")(event("KeyD", true));
handlers.get("keydown")(event("KeyD"));
assert(hits.join(",") === "0,1", "Chord independent, repeat blocked");
handlers.get("keyup")(event("KeyD"));
handlers.get("keydown")(event("KeyD"));
assert(hits.length === 3, "Released key must trigger again");
handlers.get("keydown")(event("Escape"));
assert(pauses === 1, "Escape callback");
input.clear();
assert(input.held.size === 0, "Transition clears keys");
input.setMode(6);
for (const code of ["KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"]) {
  handlers.get("keydown")(event(code));
  handlers.get("keyup")(event(code));
}
assert(hits.slice(-6).join(",") === "0,1,2,3,4,5", "Six independent lanes");
input.dispose();
assert(handlers.size === 0, "Dispose removes listeners");
delete globalThis.window;
console.log(
  "PASS Independent key input, repeated input, release, clear, and listener cleanup (mock events)",
);
