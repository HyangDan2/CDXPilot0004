// Capability detection does not guess a device model or depend on user-agent strings.
export function inputEnvironment(
  mode,
  { touchPoints = 0, coarse = false, width = 1200, height = 800 } = {},
) {
  const touch =
    mode === "touch" || (mode !== "keyboard" && (touchPoints > 0 || coarse));
  return {
    touch,
    compact:
      (touchPoints > 0 || coarse || mode === "touch") &&
      (width <= 900 || height <= 600),
  };
}
export class TouchInput {
  constructor(surface, input, enabled, canSlide) {
    this.surface = surface;
    this.input = input;
    this.enabled = enabled;
    this.canSlide = canSlide;
    this.pointers = new Map();
    this.reset = () => {
      const ids = [...this.pointers.keys()];
      this.pointers.clear();
      for (const id of ids) {
        input.release("pointer:" + id);
        if (surface.hasPointerCapture?.(id)) surface.releasePointerCapture(id);
      }
      this.paint();
    };
    input.clearHooks.add(this.reset);
    this.down = (event) => {
      if (!enabled() || (event.pointerType === "mouse" && event.button !== 0))
        return;
      const lane = this.laneAt(event);
      if (lane == null || this.pointers.has(event.pointerId)) return;
      event.preventDefault();
      this.pointers.set(event.pointerId, lane);
      surface.setPointerCapture?.(event.pointerId);
      input.press("pointer:" + event.pointerId, lane);
      this.paint();
    };
    this.move = (event) => {
      if (!this.pointers.has(event.pointerId)) return;
      event.preventDefault();
      if (!enabled()) {
        this.end(event);
        return;
      }
      const lane = this.laneAt(event),
        previous = this.pointers.get(event.pointerId);
      if (lane === previous) return;
      // Leaving the pad releases the anchor; re-entering cannot fabricate a hold.
      input.release("pointer:" + event.pointerId);
      this.pointers.set(event.pointerId, lane);
      if (lane != null && canSlide())
        input.press("pointer:" + event.pointerId, lane, true);
      this.paint();
    };
    this.end = (event) => {
      if (!this.pointers.delete(event.pointerId)) return;
      input.release("pointer:" + event.pointerId);
      if (surface.hasPointerCapture?.(event.pointerId))
        surface.releasePointerCapture(event.pointerId);
      this.paint();
    };
    this.handlers = {
      pointerdown: this.down,
      pointermove: this.move,
      pointerup: this.end,
      pointercancel: this.end,
      lostpointercapture: this.end,
    };
    for (const [name, handler] of Object.entries(this.handlers))
      surface.addEventListener(name, handler);
  }
  laneAt(event) {
    const box = this.surface.getBoundingClientRect();
    if (
      box.width <= 0 ||
      event.clientX < box.left ||
      event.clientX >= box.right ||
      event.clientY < box.top ||
      event.clientY >= box.bottom
    )
      return null;
    return Math.floor(
      ((event.clientX - box.left) / box.width) * this.input.keys.length,
    );
  }
  paint() {
    [...this.surface.children].forEach((pad, lane) =>
      pad.classList.toggle("pressed", this.input.held.has(lane)),
    );
  }
  dispose() {
    this.reset();
    this.input.clearHooks.delete(this.reset);
    for (const [name, handler] of Object.entries(this.handlers))
      this.surface.removeEventListener(name, handler);
  }
}
