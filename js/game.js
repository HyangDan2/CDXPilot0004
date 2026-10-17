import { CONFIG, grade } from "./config.js";
import { classify, nearestNote } from "./judgement.js";
export class Game {
  constructor(chart, inputOffsetMs = 0, playMode = "standard") {
    this.playMode = playMode === "free" ? "free" : "standard";
    this.health = CONFIG.health.start;
    this.failed = false;
    this.failedAt = null;
    this.lanes = chart.lanes || 4;
    this.events = [];
    this.heldSince = new Map();
    this.releasedAt = new Map();
    this.dragGroups = new Map();
    this.notes = chart.notes.map((n) => ({
      ...n,
      at: n.time + chart.offsetMs / 1000,
      done: false,
    }));
    for (const note of this.notes) {
      if (note.type === "drag") {
        if (!this.dragGroups.has(note.group))
          this.dragGroups.set(note.group, []);
        this.dragGroups.get(note.group).push(note);
      }
    }
    this.inputOffset = inputOffsetMs / 1000;
    this.score = 0;
    this.combo = 0;
    this.maximumCombo = 0;
    this.counts = { PERFECT: 0, GOOD: 0, MISS: 0 };
    this.feedback = null;
  }
  drainEvents() {
    return this.events.splice(0);
  }
  get accuracy() {
    return (this.score / (this.notes.length * CONFIG.points.PERFECT)) * 100;
  }
  get grade() {
    return grade(this.accuracy);
  }
  get complete() {
    return this.notes.every((n) => n.done);
  }
  judge(note, result, time) {
    if (this.failed || !note || note.done || !result) return;
    note.done = true;
    this.counts[result]++;
    this.score += CONFIG.points[result];
    this.combo = result === "MISS" ? 0 : this.combo + 1;
    this.maximumCombo = Math.max(this.maximumCombo, this.combo);
    this.feedback = {
      result,
      lane: note.lane,
      at: time,
      errorMs:
        result === "MISS" ? null : (time - this.inputOffset - note.at) * 1000,
    };
    this.events.push(this.feedback);
    this.health = Math.max(
      0,
      Math.min(CONFIG.health.maximum, this.health + CONFIG.health[result]),
    );
    if (this.health === 0 && this.playMode === "standard") {
      this.failed = true;
      this.failedAt = time;
    }
    return result;
  }
  release(lane, audioTime) {
    if (this.heldSince.has(lane)) {
      this.heldSince.delete(lane);
      this.releasedAt.set(lane, audioTime);
      for (const points of this.dragGroups.values())
        for (const point of points)
          if (
            point.lane === lane &&
            point.anchorAt != null &&
            point.releasedAt == null
          )
            point.releasedAt = audioTime;
    }
  }
  suspendInputs() {
    this.heldSince.clear();
    this.releasedAt.clear();
  }
  resumeInputs(held, audioTime) {
    this.suspendInputs();
    for (const lane of held) this.heldSince.set(lane, audioTime);
    for (const points of this.dragGroups.values())
      for (const point of points)
        if (point.anchorAt != null) {
          point.anchorAt = audioTime;
          point.releasedAt = held.has(point.lane)
            ? undefined
            : audioTime - 0.081;
          if (!held.has(point.lane))
            this.releasedAt.set(point.lane, audioTime - 0.081);
        }
  }
  hit(lane, audioTime, { dragOnly = false } = {}) {
    if (this.failed) return;
    this.update(audioTime);
    if (!this.heldSince.has(lane)) this.heldSince.set(lane, audioTime);
    const time = audioTime - this.inputOffset;
    const note = nearestNote(this.notes, lane, time);
    if (dragOnly && note?.type !== "drag") return;
    let result = note && classify(time - note.at);
    if (note?.type === "drag") {
      const previous = this.dragGroups.get(note.group)[note.step - 1];
      if (previous && previous.anchorAt != null) {
        const since = this.heldSince.get(previous.lane),
          released = previous.releasedAt;
        const connected =
          (since != null && since <= previous.anchorAt + 1e-9) ||
          (released != null &&
            released >= previous.anchorAt &&
            audioTime - released <= CONFIG.dragGrace + 1e-9);
        if (!connected) result = "MISS";
      } else if (previous && !previous.done) result = "MISS";
      // A timed input re-anchors the chain even after a broken link; later points can recover.
      note.anchorAt = audioTime;
      note.releasedAt = undefined;
    }
    return this.judge(note, result, audioTime);
  }
  update(audioTime) {
    const time = audioTime - this.inputOffset;
    for (const note of this.notes) {
      if (this.failed) break;
      if (!note.done && time - note.at > CONFIG.miss + 1e-9)
        this.judge(note, "MISS", audioTime);
    }
  }
}
