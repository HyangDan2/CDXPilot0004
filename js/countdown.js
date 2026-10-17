// Presentation samples this clock; audio is scheduled directly at deadline.
export class Countdown {
  constructor() {
    this.active = false;
  }
  start(now, duration = 3) {
    this.startedAt = now;
    this.deadline = now + duration;
    this.active = true;
  }
  cancel() {
    this.active = false;
  }
  label(now) {
    if (!this.active) return "";
    return now >= this.deadline
      ? "GO!"
      : String(Math.ceil(this.deadline - now));
  }
  ready(now) {
    return this.active && now >= this.deadline;
  }
}
