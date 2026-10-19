import assert from "node:assert/strict";
import { Input } from "../js/input.js";
import { TouchInput, PlayGestureGuard, inputEnvironment } from "../js/touch.js";
import { Game } from "../js/game.js";
import { sanitizeSettings } from "../js/settings.js";
assert.deepEqual(
  inputEnvironment("auto", { touchPoints: 5, width: 390, height: 844 }),
  { touch: true, compact: true },
);
assert.deepEqual(
  inputEnvironment("auto", { coarse: true, width: 844, height: 390 }),
  { touch: true, compact: true },
);
assert.deepEqual(inputEnvironment("auto", { width: 1440, height: 900 }), {
  touch: false,
  compact: false,
});
assert.equal(
  inputEnvironment("keyboard", { touchPoints: 5, width: 390 }).touch,
  false,
);
assert.equal(
  inputEnvironment("touch", { width: 1440, height: 900 }).compact,
  false,
);
assert.equal(sanitizeSettings({ inputMode: "bad" }).inputMode, "auto");
assert.equal(sanitizeSettings({ inputMode: "touch" }).inputMode, "touch");
const originalWindow = globalThis.window;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
const handlers = {},
  captures = new Set();
const surface = {
  children: [],
  addEventListener: (k, f) => (handlers[k] = f),
  removeEventListener: (k) => delete handlers[k],
  setPointerCapture: (id) => captures.add(id),
  hasPointerCapture: (id) => captures.has(id),
  releasePointerCapture: (id) => captures.delete(id),
  getBoundingClientRect: () => ({
    left: 0,
    right: 600,
    top: 0,
    bottom: 100,
    width: 600,
  }),
};
let time = 1,
  enabled = true,
  expert = true;
const notes = [
  { time: 1, lane: 0, type: "drag", group: "a", step: 0 },
  { time: 2, lane: 1, type: "drag", group: "a", step: 1 },
  { time: 3, lane: 2, type: "drag", group: "a", step: 2 },
  { time: 4, lane: 3 },
];
let game = new Game({ notes, offsetMs: 0, lanes: 4 }, 0, "free");
const input = new Input(
  (lane, slide, metadata) => game.hit(lane, time, { ...metadata, dragOnly: slide }),
  () => {},
  (lane) => game.release(lane, time),
  (source, transferring) => game.releaseSource(source, time, transferring),
);
const touch = new TouchInput(
  surface,
  input,
  () => enabled,
  () => expert,
);
const fire = (type, id, x, y = 50) =>
  handlers[type]({
    pointerId: id,
    pointerType: "touch",
    clientX: x,
    clientY: y,
    preventDefault() {},
  });
fire("pointerdown", 1, 50);
time = 2;
fire("pointermove", 1, 200);
time = 3;
fire("pointermove", 1, 350);
assert.equal(
  game.score,
  3000,
  "Sliding ribbon uses timing and hold continuity",
);
fire("pointermove", 1, 350);
assert.equal(game.score, 3000, "Move repeats do not score");
time = 4;
fire("pointermove", 1, 500);
assert.equal(game.score, 3000, "Sliding cannot hit TAP");
fire("pointerup", 1, 500);
fire("pointerdown", 1, 500);
assert.equal(game.score, 4000);
input.clear();
assert.equal(captures.size, 0);
assert.equal(touch.pointers.size, 0);
for (const lanes of [4, 6]) {
  input.setMode(lanes);
  game = new Game(
    {
      notes: Array.from({ length: lanes }, (_, lane) => ({ time: 5, lane })),
      offsetMs: 0,
      lanes,
    },
    0,
    "free",
  );
  time = 5;
  for (let lane = 0; lane < lanes; lane++)
    fire("pointerdown", lane + 10, ((lane + 0.5) * 600) / lanes);
  assert.equal(game.score, lanes * 1000);
  assert.equal(input.held.size, lanes);
  input.clear();
}
input.setMode(4);
fire("pointerdown", 1, 50);
fire("pointerdown", 2, 50);
fire("pointerup", 1, 50);
assert(input.held.has(0), "Second finger still holds lane");
input.press("key:KeyD", 0);
fire("pointercancel", 2, 50);
assert(input.held.has(0), "Keyboard still holds lane");
input.release("key:KeyD");
assert.equal(input.held.size, 0);
fire("pointerdown", 3, 50);
fire("lostpointercapture", 3, 50);
assert.equal(input.held.size, 0);
fire("pointerdown", 4, 50);
fire("pointermove", 4, -10);
assert.equal(input.held.size, 0);
input.clear();
enabled = false;
fire("pointerdown", 5, 50);
assert.equal(input.held.size, 0);
enabled = true;
expert = false;
fire("pointerdown", 6, 50);
fire("pointermove", 6, 200);
assert.equal(
  input.held.size,
  0,
  "Non-expert slides do not press adjacent pads",
);
input.clear();
expert = true;
game = new Game({ notes: notes.slice(0, 3), offsetMs: 0, lanes: 4 }, 0, "free");
time = 1;
fire("pointerdown", 20, 50);
time = 1.1;
fire("pointerup", 20, 50);
time = 1.9;
fire("pointerdown", 20, 50);
time = 2;
fire("pointermove", 20, 200);
assert.equal(
  game.counts.MISS,
  1,
  "Early release and repress cannot repair a ribbon",
);
input.clear();
game = new Game({ notes: notes.slice(0, 3), offsetMs: 0, lanes: 4 }, 0, "free");
time = 1;
fire("pointerdown", 21, 50);
game.suspendInputs();
input.clear();
fire("pointerdown", 22, 50);
game.resumeInputs(input.held, time, input.sources);
time = 2;
fire("pointermove", 22, 200);
assert.equal(
  game.score,
  2000,
  "Re-holding the anchor restores the paused ribbon",
);
assert.equal(touch.laneAt({ clientX: 50, clientY: 1 }), 0);
assert.equal(touch.laneAt({ clientX: 50, clientY: 99 }), 0);
assert.equal(touch.laneAt({ clientX: 50, clientY: 100 }), null);
input.clear();
const scoreBeforeHud = game.score;
fire("pointerdown", 30, 50, 150);
assert.equal(input.held.size, 0, "HUD below the canvas is not a lane target");
assert.equal(touch.pointers.size, 0);
assert.equal(game.score, scoreBeforeHud);
fire("pointerdown", 31, 50, 50);
fire("pointermove", 31, 50, 150);
assert.equal(
  input.held.size,
  0,
  "Dragging from a lane into the HUD releases it",
);
input.clear();
const guards = new Map();
// Use the complete pointer -> Input -> Game path, including source releases.
for (const lanes of [4, 6]) {
  const x = lane => ((lane + 0.5) * 600) / lanes;
  const start = () => {
    input.setMode(lanes);
    game = new Game({ notes: notes.slice(0, 3), offsetMs: 0, lanes, difficulty: "expert" });
    time = 1;
    fire("pointerdown", 40, x(0));
  };
  for (const ending of ["pointerup", "pointercancel", "lostpointercapture", "outside", "other-finger"]) {
    start();
    time = 1.99;
    if (ending === "outside") fire("pointermove", 40, -1);
    else if (ending !== "other-finger") fire(ending, 40, x(0));
    time = 2;
    if (ending === "outside") fire("pointermove", 40, x(1));
    else fire("pointerdown", ending === "other-finger" ? 41 : 40, x(1));
    assert.equal(game.counts.MISS, 1, `${lanes} lanes: ${ending} breaks the link even within 80ms`);
    assert.equal(game.health, 85);
    assert.equal(game.combo, 0);
    assert.equal(game.score, 1000);
    time = 3;
    fire("pointermove", ending === "other-finger" ? 41 : 40, x(2));
    assert.equal(game.counts.PERFECT, 2, 'A failed timed checkpoint can re-anchor');
    game.update(4);
    assert.equal(game.counts.MISS, 1, 'No duplicate expiry damage');
  }
  start();
  time = 2;
  fire("pointermove", 40, x(1));
  time = 3;
  fire("pointermove", 40, x(2));
  assert.equal(game.score, 3000, 'Same-finger continuous slide succeeds');
  start();
  time = 1.2;
  fire("pointerup", 40, x(0));
  game.update(3.181);
  assert.equal(game.counts.MISS, 2, 'Unplayed checkpoints expire individually');
  assert.equal(game.health, 70);
  start();
  game.suspendInputs();
  input.clear();
  fire("pointerdown", 42, x(0));
  game.resumeInputs(input.held, time, input.sources);
  time = 2;
  fire("pointermove", 42, x(1));
  assert.equal(game.score, 2000, 'Resume explicitly binds the new gesture');
}
input.clear();
let active = true,
  prevented = 0;
const guardSurface = {
  addEventListener(name, fn, options) {
    assert.equal(options.passive, false);
    guards.set(name, fn);
  },
  removeEventListener(name) {
    guards.delete(name);
  },
};
const guard = new PlayGestureGuard(guardSurface, () => active);
for (const fn of guards.values())
  fn({
    cancelable: true,
    preventDefault() {
      prevented++;
    },
  });
assert.equal(prevented, 5);
active = false;
for (const fn of guards.values())
  fn({
    cancelable: true,
    preventDefault() {
      prevented++;
    },
  });
assert.equal(prevented, 5, "Menus/dialogs retain gestures");
guard.dispose();
assert.equal(guards.size, 0);
touch.dispose();
input.dispose();
assert.equal(Object.keys(handlers).length, 0);
globalThis.window = originalWindow;
console.log(
  "PASS touch: capability modes, portrait/landscape, 4/6 multi-touch, ribbon transitions, TAP isolation, repeats, mixed sources, cancellation, bounds and cleanup",
);
