import { MODES } from "./config.js";
export class Input {
  constructor(onHit, onPause, onRelease = () => {}) {
    this.held = new Set();
    this.sources = new Map();
    this.clearHooks = new Set();
    this.onHit = onHit;
    this.onRelease = onRelease;
    this.keys = MODES[4].keys;
    this.down = (event) => {
      if (
        event.target.matches(
          'input, select, textarea, [contenteditable="true"]',
        )
      )
        return;
      if (event.code === "Escape" && !event.repeat) {
        if (onPause()) event.preventDefault();
        return;
      }
      const lane = this.keys.indexOf(event.code);
      if (lane < 0) return;
      event.preventDefault();
      if (event.repeat) return;
      this.press("key:" + event.code, lane);
    };
    this.up = (event) => {
      this.release("key:" + event.code);
    };
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
  }
  press(source, lane, slide = false) {
    if (this.sources.has(source)) return;
    this.sources.set(source, lane);
    if (this.held.has(lane)) return;
    this.held.add(lane);
    this.onHit(lane, slide);
  }
  release(source) {
    const lane = this.sources.get(source);
    if (lane == null) return;
    this.sources.delete(source);
    if ([...this.sources.values()].includes(lane)) return;
    this.held.delete(lane);
    this.onRelease(lane);
  }
  setMode(lanes) {
    this.clear();
    this.keys = MODES[lanes].keys;
  }
  clear() {
    this.held.clear();
    this.sources.clear();
    for (const hook of this.clearHooks) hook();
  }
  dispose() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    this.clear();
  }
}
