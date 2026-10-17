import { Game } from "../js/game.js";
import { Countdown } from "../js/countdown.js";
import { AudioEngine } from "../js/audio.js";
import { MascotReaction } from "../js/mascot.js";
import { SoundEffects, RESULT_MELODIES } from "../js/sfx.js";
import { sanitizeSettings } from "../js/settings.js";
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
}
function assert(value, message) {
  if (!value) throw new Error(message);
}
const chart = {
  lanes: 6,
  offsetMs: 0,
  notes: Array.from({ length: 30 }, (_, i) => ({ time: i + 1, lane: i % 6 })),
};
test("Standard fails once at zero and leaves future notes unresolved", () => {
  const g = new Game(chart);
  g.update(50);
  assert(
    g.failed && g.health === 0 && g.counts.MISS === 13,
    "Expected 13 misses to exhaust 100 health",
  );
  const at = g.failedAt;
  g.update(60);
  g.hit(0, 70);
  assert(
    g.counts.MISS === 13 && g.failedAt === at && !g.complete,
    "Terminal game must not process future notes",
  );
});
test("Health cap, recovery, and duplicate prevention", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  assert(g.health === 100, "Cap at 100");
  g.hit(1, 2.15);
  assert(g.health === 92, "Miss costs eight");
  g.hit(2, 3.1);
  assert(g.health === 93, "Good heals one");
  g.hit(3, 4);
  g.hit(3, 4);
  assert(g.health === 95, "Perfect heals two once");
});
test("Free Play survives zero and can recover", () => {
  const g = new Game(chart, 0, "free");
  g.update(13.2);
  assert(
    !g.failed && g.health === 0 && g.counts.MISS === 13,
    "Free mode must not fail",
  );
  g.hit(1, 14);
  assert(g.health === 2, "Recover from zero");
  g.update(40);
  assert(g.complete && !g.failed, "Free mode reaches completion");
});
test("Restart and mode snapshots are independent", () => {
  const a = new Game(chart);
  a.update(99);
  const b = new Game(chart, 0, "free");
  assert(
    b.health === 100 && !b.failed && b.score === 0 && a.playMode === "standard",
    "Fresh state",
  );
});
test("Overlapping expert windows select the nearest pending note", () => {
  const g = new Game({
    offsetMs: 0,
    notes: [
      { time: 1, lane: 0 },
      { time: 1.11, lane: 0 },
    ],
  });
  g.hit(0, 1.08);
  assert(!g.notes[0].done && g.notes[1].done, "Nearest target");
  g.hit(0, 1.09);
  assert(
    g.notes.every((n) => n.done) && g.score === 1500,
    "Distinct resolution without duplicates",
  );
});
test("Countdown uses exact clock boundaries and cancels", () => {
  const c = new Countdown();
  c.start(10);
  assert(
    c.label(10) === "3" && c.label(11) === "2" && c.label(12) === "1",
    "Count labels",
  );
  assert(!c.ready(12.999) && c.ready(13) && c.label(13) === "GO!", "Exact GO");
  c.cancel();
  assert(!c.ready(20) && c.label(20) === "", "Cancelled");
  c.start(30, 2);
  assert(c.label(30) === "2" && c.deadline === 32, "Resume count");
});
test("Scheduled audio freezes until GO and cancels before start", () => {
  const a = new AudioEngine();
  let source;
  a.context = {
    currentTime: 10,
    createBufferSource() {
      return (source = {
        connect() {},
        disconnect() {},
        start(at, offset) {
          this.at = at;
          this.offset = offset;
        },
        stop() {
          this.stopped = true;
        },
      });
    },
  };
  a.gain = {};
  a.buffer = { duration: 120 };
  a.play(13);
  a.context.currentTime = 12;
  assert(a.time === 0 && source.at === 13, "No advance before GO");
  a.pause();
  assert(source.stopped && a.position === 0, "Cancel future start");
  a.context.currentTime = 20;
  a.play(23);
  a.context.currentTime = 23.125;
  assert(a.time === 0.125, "GO origin");
  a.pause();
  a.context.currentTime = 30;
  a.play(32);
  a.context.currentTime = 31;
  assert(a.time === 0.125, "Resume preserves position during count");
  a.context.currentTime = 32.5;
  assert(a.time === 0.625, "Resume continuous");
});
test("Mascot priority, reaction hold, low health and terminal states", () => {
  const m = new MascotReaction();
  m.react([{ result: "GOOD" }, { result: "PERFECT" }], 1);
  assert(m.expression("playing", 100, 1) === "perfect", "Chord picks perfect");
  m.react([{ result: "GOOD" }], 1.1);
  assert(
    m.expression("playing", 100, 1.2) === "perfect",
    "Hold stronger reaction",
  );
  m.react([{ result: "MISS" }], 1.2);
  assert(m.expression("playing", 20, 1.3) === "miss", "Miss wins");
  assert(
    m.expression("playing", 20, 2) === "worried",
    "Low health after reaction",
  );
  assert(
    m.expression("failed", 0, 2) === "failed" &&
      m.expression("clear", 0, 2) === "clear",
    "Terminal state wins",
  );
  assert(m.expression("countdown", 100, 2) === "ready", "Ready pose");
  m.reset();
  assert(m.expression("playing", 100, 0) === "idle", "Reset");
});
test("Settings migrate safely with expert, free mode, volume and character", () => {
  const s = sanitizeSettings({
    volume: 60,
    difficulty: "expert",
    playMode: "free",
    character: false,
    musicVolume: 999,
    sfxVolume: -4,
  });
  assert(
    s.volume === 60 &&
      s.difficulty === "expert" &&
      s.playMode === "free" &&
      !s.character &&
      s.musicVolume === 100 &&
      s.sfxVolume === 0,
    "Validate new settings",
  );
  const d = sanitizeSettings({ volume: 50 });
  assert(
    d.playMode === "standard" && d.musicVolume === 100 && d.character === true,
    "Old preferences migrate",
  );
});
test("Countdown and result sounds stop and release all voices", () => {
  const oscillators = [];
  const context = {
    currentTime: 5,
    createOscillator() {
      const o = {
        frequency: { value: 0 },
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
        start(at) {
          this.startAt = at;
        },
        stop() {
          this.stopped = true;
        },
      };
      oscillators.push(o);
      return o;
    },
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    },
  };
  const sfx = new SoundEffects({ context, sfxGain: {} });
  sfx.countdown(5, 8);
  assert(
    oscillators.length === 4 && oscillators[3].startAt === 8,
    "GO tone shares deadline",
  );
  sfx.result("S", false);
  assert(
    sfx.voices.size === 5 &&
      oscillators.slice(0, 4).every((o) => o.disconnected),
    "Replace count with fanfare",
  );
  sfx.result("D", true);
  assert(
    sfx.voices.size === 4 &&
      RESULT_MELODIES.failed[0] > RESULT_MELODIES.failed.at(-1),
    "Descending failure sound",
  );
  sfx.stop();
  assert(
    sfx.voices.size === 0 && oscillators.every((o) => o.disconnected),
    "No lingering sound nodes",
  );
});
if (typeof document !== "undefined") {
  const pre = document.getElementById("expansion-results");
  pre.textContent = results
    .map(
      (r) =>
        `${r.passed ? "PASS" : "FAIL"} ${r.name}${r.error ? " — " + r.error : ""}`,
    )
    .join("\n");
} else {
  for (const r of results)
    console.log(
      `${r.passed ? "PASS" : "FAIL"} ${r.name}${r.error ? " — " + r.error : ""}`,
    );
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
export { results };
