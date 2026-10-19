// VisualViewport scale reports pinch zoom, not the software keyboard's height change.
export function isPageZoomed(viewport) {
  const scale = viewport?.scale;
  return Number.isFinite(scale) && Math.abs(scale - 1) > 0.02;
}

export function isMobileViewport({ touchPoints = 0, coarse = false, width, height }) {
  return (touchPoints > 0 || coarse) && (coarse || width <= 900 || height <= 600);
}

// Do not cancel single-finger scrolling, pointer events, taps, or game multi-touch.
export class MobileZoomGuard {
  constructor(surface, enabled) {
    this.surface = surface;
    this.handlers = new Map();
    for (const name of ["gesturestart", "gesturechange", "gestureend", "dblclick", "touchmove"]) {
      const handler = event => {
        if (!enabled() || !event.cancelable) return;
        if (name === "touchmove" &&
            ((event.touches?.length || 0) < 2 || event.target?.closest?.("#game-canvas"))) return;
        event.preventDefault();
      };
      this.handlers.set(name, handler);
      surface.addEventListener(name, handler, { passive: false });
    }
  }
  dispose() {
    for (const [name, handler] of this.handlers)
      this.surface.removeEventListener(name, handler);
  }
}

// The browser owns its zoom level; never promise a programmatic reset.
export class ViewportGate {
  constructor(readBlocked, showRecovery, closeRecovery) {
    this.readBlocked = readBlocked;
    this.showRecovery = showRecovery;
    this.closeRecovery = closeRecovery;
  }
  allow() {
    if (this.readBlocked()) {
      this.showRecovery();
      return false;
    }
    this.closeRecovery();
    return true;
  }
}
