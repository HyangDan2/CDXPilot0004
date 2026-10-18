export const MODES = Object.freeze({
  4: {
    keys: ["KeyD", "KeyF", "KeyJ", "KeyK"],
    colors: ["#4de6ff", "#9d8dff", "#e580ff", "#ff62b7"],
  },
  6: {
    keys: ["KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"],
    colors: ["#55f2cb", "#4de6ff", "#9d8dff", "#e580ff", "#ff62b7", "#ffc47e"],
  },
});
export const HEALTH_RULES = Object.freeze({
  easy: Object.freeze({ PERFECT: 0.5, GOOD: 0, MISS: -8 }),
  normal: Object.freeze({ PERFECT: 0.4, GOOD: 0, MISS: -10 }),
  hard: Object.freeze({ PERFECT: 0.3, GOOD: 0, MISS: -12 }),
  expert: Object.freeze({ PERFECT: 0.2, GOOD: 0, MISS: -15 }),
});
export const CONFIG = Object.freeze({
  ...MODES[4],
  perfect: 0.05,
  good: 0.12,
  miss: 0.18,
  points: { PERFECT: 1000, GOOD: 500, MISS: 0 },
  approach: 1.8,
  dragGrace: 0.08,
  health: { maximum: 100, start: 100, low: 25 },
});
export const DIFFICULTIES = ["easy", "normal", "hard", "expert"];
export const grade = (accuracy) =>
  accuracy >= 95
    ? "S"
    : accuracy >= 90
      ? "A"
      : accuracy >= 80
        ? "B"
        : accuracy >= 70
          ? "C"
          : "D";
export function noteY(target, time, height, speed = 1) {
  return height - ((target - time) / (CONFIG.approach / speed)) * height;
}
