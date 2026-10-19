import assert from "node:assert/strict";
import { isPageZoomed, isMobileViewport, MobileZoomGuard, ViewportGate } from "../js/viewport.js";

assert.equal(isPageZoomed({ scale: 1, height: 300 }), false, "Software keyboard height is not zoom");
assert.equal(isPageZoomed({ scale: 1.01 }), false, "Allow tiny reporting noise");
for (const scale of [0.7, 1.1, 2, 3]) assert.equal(isPageZoomed({ scale }), true);
for (const viewport of [undefined, {}, { scale: NaN }]) assert.equal(isPageZoomed(viewport), false);
assert.equal(isMobileViewport({ touchPoints: 5, width: 390, height: 844 }), true);
assert.equal(isMobileViewport({ coarse: true, width: 844, height: 390 }), true);
assert.equal(isMobileViewport({ touchPoints: 0, width: 390, height: 844 }), false);
assert.equal(isMobileViewport({ touchPoints: 5, width: 1440, height: 900 }), false);
assert.equal(isMobileViewport({ coarse: true, touchPoints: 5, width: 1024, height: 768 }), true, "Landscape tablets remain protected");

const handlers = new Map();
let enabled = true;
const surface = {
  addEventListener(name, handler, options) {
    assert.equal(options.passive, false);
    handlers.set(name, handler);
  },
  removeEventListener(name, handler) {
    assert.equal(handlers.get(name), handler);
    handlers.delete(name);
  },
};
const guard = new MobileZoomGuard(surface, () => enabled);
const send = (name, { count = 1, canvas = false, cancelable = true } = {}) => {
  let prevented = false;
  handlers.get(name)({
    cancelable, touches: Array.from({ length: count }, () => ({})),
    target: { closest: () => canvas },
    preventDefault() { prevented = true; },
  });
  return prevented;
};
assert.equal(send("touchmove"), false, "Single-finger menu scroll remains native");
assert.equal(send("touchmove", { count: 2 }), true, "Menu pinch fallback is cancelled");
for (const count of [2, 3, 4, 6])
  assert.equal(send("touchmove", { count, canvas: true }), false, "Global guard leaves game multi-touch to the play guard");
for (const name of ["gesturestart", "gesturechange", "gestureend", "dblclick"]) {
  assert.equal(send(name), true);
  assert.equal(send(name, { cancelable: false }), false);
}
assert.equal(handlers.has("pointerdown"), false, "No interference with note pointer events");
assert.equal(handlers.has("touchstart"), false, "Do not suppress ordinary taps");
enabled = false;
for (const name of handlers.keys())
  assert.equal(send(name, { count: 2 }), false, "Desktop/recovery gestures remain available");
guard.dispose();
assert.equal(handlers.size, 0);

let scale = 2, shown = 0, closed = 0, scheduled = 0;
const gate = new ViewportGate(
  () => isPageZoomed({ scale }), () => shown++, () => closed++,
);
const schedule = () => { if (gate.allow()) scheduled++; };
schedule();
assert.equal(shown, 1);
assert.equal(scheduled, 0, "Zoomed start/resume must not schedule audio");
scale = 1;
assert.equal(scheduled, 0, "Recovery must not auto-start gameplay");
schedule();
assert.equal(closed, 1);
assert.equal(scheduled, 1);
// Recheck after an asynchronous preparation/activation boundary.
assert.equal(gate.allow(), true);
await Promise.resolve().then(() => { scale = 1.5; });
schedule();
assert.equal(scheduled, 1, "Zoom changed during preparation blocks scheduling");
console.log("PASS viewport: scale detection, mobile capabilities, menu scrolling, multi-touch isolation, recovery gate and async recheck (simulated)");
