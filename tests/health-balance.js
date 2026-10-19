import assert from "node:assert/strict";
import { Game } from "../js/game.js";
const rules = {
  easy: [2, 8, 13],
  normal: [2, 10, 10],
  hard: [2, 12, 9],
  expert: [2, 15, 7],
};
for (const [difficulty, [heal, damage, misses]] of Object.entries(rules)) {
  const chart = {
    difficulty,
    lanes: 4,
    offsetMs: 0,
    notes: Array.from({ length: 200 }, (_, i) => ({
      time: i + 1,
      lane: i % 4,
    })),
  };
  const game = new Game(chart);
  game.hit(0, 1.15);
  assert.equal(game.health, 100 - damage);
  game.hit(1, 2.1);
  assert.equal(game.health, 100 - damage + 1, "GOOD heals one");
  game.hit(2, 3);
  assert.equal(game.health, 100 - damage + 1 + heal);
  game.hit(2, 3);
  assert.equal(game.health, 100 - damage + 1 + heal, "No duplicate recovery");
  const failed = new Game(chart);
  failed.update(300);
  assert.equal(failed.counts.MISS, misses);
  assert(failed.failed);
  assert.equal(failed.health, 0);
  failed.hit(0, 400);
  assert.equal(failed.counts.MISS, misses);
  const free = new Game(chart, 0, "free");
  free.update(20.2);
  assert.equal(free.health, 0);
  assert(!free.failed);
  free.hit(0, 21);
  assert.equal(free.health, heal);
  for (let i = 21; i < 100; i++) free.hit(i % 4, i + 1);
  assert.equal(
    free.health,
    Math.min(100, 80 * heal),
    "Recovery caps at 100 over many hits",
  );
  const intermittent = new Game(chart);
  for (const [i, note] of chart.notes.entries()) {
    intermittent.hit(note.lane, note.time + (i % 3 === 0 ? 0.15 : 0));
    if (intermittent.failed) break;
  }
  assert(
    intermittent.failed,
    "One miss per two perfects must eventually fail",
  );
  const chords = new Game(
    { ...chart, notes: [0, 1, 2].map((lane) => ({ time: 1, lane })) },
    0,
    "free",
  );
  chords.update(2);
  assert.equal(
    chords.health,
    100 - 3 * damage,
    "Chord misses each cost health",
  );
  const capped = new Game(chart);
  capped.hit(0, 1);
  assert.equal(capped.health, 100);
  console.log(
    `PASS ${difficulty}: PERFECT +2, GOOD +1, ${misses}-miss failure, intermittent errors, chords, Free Play and cap`,
  );
}
const ribbon = new Game(
  {
    difficulty: "expert",
    lanes: 4,
    offsetMs: 0,
    notes: [0, 1, 2].map((lane, step) => ({
      time: step + 1,
      lane,
      type: "drag",
      group: "r",
      step,
    })),
  },
  0,
  "free",
);
ribbon.update(4);
assert.equal(ribbon.health, 55);
assert.equal(ribbon.counts.MISS, 3);
console.log("PASS legacy drag fixture retains per-checkpoint damage");
