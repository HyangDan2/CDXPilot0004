import { MODES } from "./config.js";
export class Input {
  constructor(onHit, onPause, onRelease = () => {}) {
    this.held = new Set();
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
      if (event.repeat || this.held.has(lane)) return;
      this.held.add(lane);
      onHit(lane);
    };
    this.up = (event) => {
      const lane = this.keys.indexOf(event.code);
      if (this.held.delete(lane)) onRelease(lane);
    };
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
  }
  setMode(lanes) {
    this.clear();
    this.keys = MODES[lanes].keys;
  }
  clear() {
    this.held.clear();
  }
  dispose() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    this.clear();
  }
}
