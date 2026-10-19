import assert from "node:assert/strict";
import { Game } from "../js/game.js";
import { Input } from "../js/input.js";
import { TouchInput } from "../js/touch.js";
import { validateBeatmap } from "../js/beatmap.js";
import { HighScores, scoreKey } from "../js/highscores.js";
const chart = {
  id: "hold", trackId: "test", title: "Hold test", artist: "Test", bpm: 120,
  offsetMs: 0, duration: 10, lanes: 4, difficulty: "expert", version: "6",
  notes: [1, 2, 3].map((time, step) => ({ time, lane: 0, type: "hold", group: "h", step })),
};
validateBeatmap(chart);
for (const kind of ["keyboard", "touch"]) {
  const source = kind === "touch" ? "pointer:1:1" : "key:KeyD";
  const options = { kind, source };
  const game = new Game(chart);
  assert.equal(game.hit(0, 1, options), "PERFECT");
  game.update(2);
  game.releaseSource(source, 3);
  game.release(0, 3);
  game.update(4);
  assert.equal(game.score, 3000, "Exact END release succeeds and scores once");
  assert.equal(game.maximumCombo, 3);
  const broken = new Game(chart);
  broken.hit(0, 1, options);
  broken.releaseSource(source, 1.999);
  broken.release(0, 1.999);
  broken.hit(0, 2, options);
  broken.update(3);
  assert.deepEqual(broken.counts, { PERFECT: 1, GOOD: 0, MISS: 1 });
  assert.equal(broken.health, 85);
  assert(broken.complete, "Failed body disappears immediately");
  assert.equal(broken.notes.filter(n => n.forfeited).length, 1);
  assert.equal(broken.events.filter(e => e.result === "MISS").length, 1);
  assert(Math.abs(broken.accuracy - 100 / 3) < 1e-9, "Forfeited points stay in the denominator");
  assert.equal(broken.combo, 0);
  assert.equal(broken.score, 1000, "Repress cannot score maintenance checkpoints");
  const lateFrame = new Game(chart);
  lateFrame.hit(0, 1, options);
  lateFrame.releaseSource(source, 2.5);
  lateFrame.update(4);
  assert.deepEqual(lateFrame.counts, { PERFECT: 2, GOOD: 0, MISS: 1 }, "Settle checkpoints before release even without a frame");
  for (const wasBroken of [false, true]) {
    const paused = new Game(chart);
    paused.hit(0, 1, options);
    if (wasBroken) paused.releaseSource(source, 1.2);
    paused.suspendInputs(1.5);
    paused.releaseSource(source, 1.5);
    paused.release(0, 1.5);
    const replacement = kind === "touch" ? "pointer:1:2" : source;
    paused.resumeInputs(new Set([0]), 1.5, new Map([[replacement, 0]]));
    paused.update(3);
    assert.equal(paused.score, wasBroken ? 1000 : 3000, "Resume cannot repair an already broken HOLD");
  }
  const noRehold = new Game(chart);
  noRehold.hit(0, 1, options);
  noRehold.suspendInputs(1.5);
  noRehold.resumeInputs(new Set(), 1.5, new Map());
  noRehold.hit(0, 1.6, options);
  noRehold.update(3);
  assert.equal(noRehold.counts.MISS, 1, "Missing the resume re-hold permanently breaks the HOLD");
}
const good = new Game(chart, 100);
assert.equal(good.hit(0, 1.18), "GOOD");
good.update(3.1);
assert.equal(good.score, 2500, "GOOD start and corrected automatic checkpoints");
const missed = new Game(chart);
missed.update(1.181);
missed.hit(0, 2);
missed.update(3);
assert.equal(missed.counts.MISS, 1, "Missed start cannot be recovered");
const free = new Game(chart, 0, "free");
free.health = 10;
free.update(4);
assert.equal(free.counts.MISS, 1);
assert.equal(free.failed, false);
const failed = new Game(chart);
failed.health = 10;
failed.update(4);
assert.equal(failed.counts.MISS, 1);
assert.equal(failed.notes.filter(n => !n.done).length, 0, "Failed HOLD is removed as one terminal event");

// Validate sustained occupancy between checkpoint times, not just simultaneous targets.
for (const lanes of [4, 6]) {
  validateBeatmap({ ...chart, lanes, notes: [...chart.notes, { time: 1.5, lane: 1 }] });
  for (const extras of [
    [{ time: 1.5, lane: 0 }],
    [{ time: 1.5, lane: 1 }, { time: 1.5, lane: 2 }],
    [1.5, 2.5].map((time, step) => ({ time, lane: 1, type: "hold", group: "other", step })),
  ]) assert.throws(() => validateBeatmap({ ...chart, lanes, notes: [...chart.notes, ...extras] }));
}
assert.throws(() => validateBeatmap({ ...chart, difficulty: "hard" }));
validateBeatmap({ ...chart, difficulty: "hard", holdTier: "hard" });
assert.throws(() => validateBeatmap({ ...chart, difficulty: "normal", holdTier: "hard" }));
assert.throws(() => validateBeatmap({ ...chart, notes: chart.notes.map((n, i) => ({ ...n, lane: i })) }));

// Full touch adapter path: one contact holds while a second taps another lane.
const oldWindow = globalThis.window;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
for (const lanes of [4, 6]) {
  const handlers = new Map(), captures = new Set();
  const surface = {
    addEventListener: (name, fn) => handlers.set(name, fn),
    removeEventListener: name => handlers.delete(name),
    setPointerCapture: id => captures.add(id),
    hasPointerCapture: id => captures.has(id),
    releasePointerCapture: id => captures.delete(id),
    getBoundingClientRect: () => ({ left: 0, right: 600, top: 0, bottom: 100, width: 600 }),
  };
  let time = 1;
  let game;
  const input = new Input(
    (lane, slide, meta) => game.hit(lane, time, { ...meta, dragOnly: slide }),
    () => {}, lane => game.release(lane, time),
    (source, transfer) => game.releaseSource(source, time, transfer),
  );
  input.setMode(lanes);
  const touch = new TouchInput(surface, input, () => true, () => false);
  const fire = (type, id, lane) => handlers.get(type)({
    pointerType: "touch", pointerId: id, clientX: (lane + 0.5) * 600 / lanes,
    clientY: 50, preventDefault() {},
  });
  game = new Game({ ...chart, lanes, notes: [...chart.notes, { time: 2, lane: 1 }].sort((a,b) => a.time-b.time) });
  fire("pointerdown", 1, 0);
  time = 2;
  fire("pointerdown", 2, 1);
  assert.equal(input.held.size, 2);
  fire("pointerup", 2, 1);
  time = 3;
  fire("pointerup", 1, 0);
  assert.equal(game.score, 4000, "HOLD plus simultaneous TAP scores fully");
  input.clear(); time = 1;
  game = new Game({ ...chart, lanes, notes: [...chart.notes, { time: 2, lane: 1 }].sort((a,b) => a.time-b.time) });
  input.press("key:" + input.keys[0], 0);
  time = 2;
  input.press("key:" + input.keys[1], 1);
  input.release("key:" + input.keys[1]);
  time = 3;
  input.release("key:" + input.keys[0]);
  assert.equal(game.score, 4000, "Keyboard HOLD plus simultaneous TAP scores fully");
  for (const ending of ["pointerup", "pointercancel", "lostpointercapture", "pointermove"]) {
    input.clear(); time = 1; game = new Game({ ...chart, lanes });
    fire("pointerdown", 1, 0);
    fire("pointerdown", 2, 0);
    time = 1.5;
    fire(ending, 1, ending === "pointermove" ? 1 : 0);
    assert(input.held.has(0), "Replacement finger still holds the aggregate lane");
    game.update(3);
    assert.equal(game.counts.MISS, 1, "A second source cannot hide original finger release");
  }
  touch.dispose(); input.dispose();
  assert.equal(captures.size, 0);
}
globalThis.window = oldWindow;
const data = new Map();
const storage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) };
const records = new HighScores(storage);
const oldKey = scoreKey({ ...chart, version: "5" }, "standard"), newKey = scoreKey(chart, "standard");
records.save({id:"old", key:oldKey, score:3000, accuracy:100, combo:3, date:"2026-10-19T00:00:00.000Z"}, "OLD");
const reload = new HighScores(storage);
assert.equal(reload.table(oldKey).length, 1);
assert.equal(reload.table(newKey).length, 0, "Revision 6 does not mix previous HOLD scores");
console.log("PASS HOLD: keyboard/touch sustain, second-finger TAP, release/cancel/slide loss, no recovery, pause, offsets, occupancy, survival and record separation");

const independent = new Game({...chart, notes: [...chart.notes, {time: 4, lane: 1}]});
independent.hit(0, 1);
independent.release(0, 1.2);
assert.equal(independent.health, 85);
assert.equal(independent.counts.MISS, 1);
assert(independent.notes.filter(n => n.type === "hold").every(n => n.done));
assert(!independent.complete, "Unrelated TAP remains playable");
independent.hit(1, 4);
assert.equal(independent.score, 2000);
assert.equal(independent.health, 87);
const terminal = new Game({...chart, notes: [...chart.notes, {time: 4, lane: 1}]});
terminal.health = 10;
terminal.update(10);
assert(terminal.failed);
assert(!terminal.notes.at(-1).done, "Terminal HOLD loss freezes unrelated future TAPs");
console.log("PASS single HOLD penalty, immediate disappearance, independent TAP and terminal freeze");
