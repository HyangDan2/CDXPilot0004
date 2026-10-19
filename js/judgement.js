import { CONFIG } from "./config.js";
export function classify(delta) {
  const error = Math.abs(delta);
  if (error <= CONFIG.perfect + 1e-9) return "PERFECT";
  if (error <= CONFIG.good + 1e-9) return "GOOD";
  if (error <= CONFIG.miss + 1e-9) return "MISS";
  return null;
}
export function nearestNote(notes, lane, time) {
  let closest = null,
    distance = Infinity;
  for (const note of notes) {
    if (note.done || note.lane !== lane || (note.type === "hold" && note.step > 0)) continue;
    const delta = Math.abs(note.at - time);
    if (delta <= CONFIG.miss + 1e-9 && delta < distance) {
      closest = note;
      distance = delta;
    }
  }
  return closest;
}
