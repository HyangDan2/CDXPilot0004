import { CONFIG, HEALTH_RULES, grade } from "./config.js";
import { classify, nearestNote } from "./judgement.js";
export class Game {
  constructor(chart, inputOffsetMs = 0, playMode = "standard") {
    this.playMode = playMode === "free" ? "free" : "standard";
    this.health = CONFIG.health.start;
    this.healthRules = HEALTH_RULES[chart.difficulty] || HEALTH_RULES.normal;
    this.failed = false;
    this.failedAt = null;
    this.lanes = chart.lanes || 4;
    this.events = [];
    this.heldSince = new Map();
    this.releasedAt = new Map();
    this.dragGroups = new Map();
    this.holdGroups = new Map();
    this.notes = chart.notes.map((n) => ({
      ...n,
      at: n.time + chart.offsetMs / 1000,
      done: false,
    }));
    for (const note of this.notes) {
      if (note.type === "hold") {
        if (!this.holdGroups.has(note.group))
          this.holdGroups.set(note.group, { points: [], started: false, broken: false, suspended: false });
        this.holdGroups.get(note.group).points.push(note);
      }
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
  failHold(hold, time) {
    if (this.failed || hold.points.every(point => point.done)) return;
    return this.judge(hold.points.find(point => !point.done), "MISS", time);
  }
  judge(note, result, time) {
    if (this.failed || !note || note.done || !result) return;
    note.done = true;
    if (note.type === "hold" && result === "MISS") {
      const hold = this.holdGroups.get(note.group);
      hold.broken = true;
      // Forfeit remaining targets without additional judgement or health events.
      for (const point of hold.points) {
        if (!point.done) { point.done = true; point.forfeited = true; }
      }
    }
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
      Math.min(
        CONFIG.health.maximum,
        Math.round((this.health + this.healthRules[result]) * 10) / 10,
      ),
    );
    if (this.health === 0 && this.playMode === "standard") {
      this.failed = true;
      this.failedAt = time;
    }
    return result;
  }
  release(lane, audioTime) {
    // Settle due checkpoints before releasing, including an exact END release.
    this.update(audioTime);
    for (const hold of this.holdGroups.values())
      if (hold.started && !hold.suspended && hold.points[0].lane === lane && !hold.points.at(-1).done)
        this.failHold(hold, audioTime);
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
  releaseSource(source, audioTime, transferring = false) {
    this.update(audioTime);
    for (const hold of this.holdGroups.values())
      if (hold.started && !hold.suspended && hold.source === source && !hold.points.at(-1).done)
        this.failHold(hold, audioTime);
    // A second source holding the lane must not conceal the original source's release.
    for (const points of this.dragGroups.values())
      for (const point of points)
        if (point.anchorSource === source && point.anchorAt != null) {
          if (point.anchorKind === "touch") {
            if (!transferring) point.touchBroken = true;
          } else if (point.releasedAt == null) point.releasedAt = audioTime;
        }
  }
  suspendInputs(audioTime = null) {
    if (audioTime != null) this.update(audioTime);
    for (const hold of this.holdGroups.values()) hold.suspended = true;
    this.heldSince.clear();
    this.releasedAt.clear();
  }
  resumeInputs(held, audioTime, sources = null) {
    this.suspendInputs();
    for (const lane of held) this.heldSince.set(lane, audioTime);
    for (const hold of this.holdGroups.values()) {
      hold.suspended = false;
      if (!hold.started || hold.broken || hold.points.at(-1).done) continue;
      const lane = hold.points[0].lane;
      const entry = sources && [...sources].find(([source, value]) =>
        value === lane && source.startsWith("pointer:") === (hold.kind === "touch"));
      if (!held.has(lane) || (sources && !entry)) this.failHold(hold, audioTime);
      else if (entry) hold.source = entry[0];
    }
    for (const points of this.dragGroups.values())
      for (const point of points)
        if (point.anchorAt != null) {
          if (sources) {
            const entry = [...sources].find(([source, lane]) =>
              lane === point.lane &&
              source.startsWith("pointer:") === (point.anchorKind === "touch"));
            point.anchorSource = entry?.[0];
            point.touchBroken = !entry;
          }
          point.anchorAt = audioTime;
          point.releasedAt = held.has(point.lane)
            ? undefined
            : audioTime - 0.081;
          if (!held.has(point.lane))
            this.releasedAt.set(point.lane, audioTime - 0.081);
        }
  }
  hit(
    lane,
    audioTime,
    { dragOnly = false, source = null, kind = "keyboard", fromLane = null } = {},
  ) {
    if (this.failed) return;
    this.update(audioTime);
    if (!this.heldSince.has(lane)) this.heldSince.set(lane, audioTime);
    const time = audioTime - this.inputOffset;
    const note = nearestNote(this.notes, lane, time);
    if (dragOnly && note?.type !== "drag") return;
    let result = note && classify(time - note.at);
    if (note?.type === "hold" && note.step === 0) {
      const hold = this.holdGroups.get(note.group);
      hold.started = result === "PERFECT" || result === "GOOD";
      hold.broken = !hold.started;
      hold.source = source;
      hold.kind = kind;
    }
    if (note?.type === "drag") {
      const previous = this.dragGroups.get(note.group)[note.step - 1];
      if (previous && previous.anchorAt != null) {
        const since = this.heldSince.get(previous.lane),
          released = previous.releasedAt;
        const keyboardConnected =
          (released == null && since != null && since <= previous.anchorAt + 1e-9) ||
          (released != null &&
            released >= previous.anchorAt &&
            audioTime - released <= CONFIG.dragGrace + 1e-9);
        const connected = kind === "touch"
          ? previous.anchorKind === "touch" && !previous.touchBroken &&
            source != null && source === previous.anchorSource && dragOnly &&
            fromLane === previous.lane
          : previous.anchorKind === "keyboard" && !previous.touchBroken && keyboardConnected;
        if (!connected) result = "MISS";
      } else if (previous && !previous.done) result = "MISS";
      // A timed input re-anchors the chain even after a broken link; later points can recover.
      note.anchorAt = audioTime;
      note.anchorKind = kind;
      note.anchorSource = source;
      note.touchBroken = false;
      note.releasedAt = undefined;
    }
    return this.judge(note, result, audioTime);
  }
  update(audioTime) {
    const time = audioTime - this.inputOffset;
    for (const note of this.notes) {
      if (this.failed) break;
      if (!note.done && note.type === "hold" && note.step > 0) {
        const hold = this.holdGroups.get(note.group);
        if (!hold.suspended && time >= note.at - 1e-9)
          this.judge(note, hold.started && !hold.broken ? "PERFECT" : "MISS", note.at + this.inputOffset);
        continue;
      }
      if (!note.done && time - note.at > CONFIG.miss + 1e-9)
        this.judge(note, "MISS", audioTime);
    }
  }
}
