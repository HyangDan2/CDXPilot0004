export class Calibration {
  constructor(audio, message, ring, onComplete) {
    this.audio = audio;
    this.message = message;
    this.ring = ring;
    this.onComplete = onComplete;
    this.samples = [];
    this.running = false;
    this.generation = 0;
    this.tapped = new Set();
  }
  async start() {
    this.stop();
    const generation = this.generation;
    await this.audio.activate();
    if (generation !== this.generation) return;
    const context = this.audio.context;
    const buffer = context.createBuffer(
        1,
        context.sampleRate * 13,
        context.sampleRate,
      ),
      data = buffer.getChannelData(0);
    for (let beat = 1; beat <= 12; beat++)
      for (let i = 0; i < context.sampleRate * 0.06; i++) {
        const t = i / context.sampleRate;
        data[beat * context.sampleRate + i] =
          Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 70) * 0.5;
      }
    this.source = context.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.audio.sfxGain || this.audio.gain);
    this.startedAt = context.currentTime + 0.1;
    this.source.start(this.startedAt);
    this.running = true;
    this.samples = [];
    this.tapped.clear();
    this.message.textContent =
      "Warm up for two clicks, then tap SPACE with the sound.";
  }
  get time() {
    return this.audio.context.currentTime - this.startedAt;
  }
  tap() {
    if (!this.running) return;
    const time = this.time,
      beat = Math.round(time);
    if (
      beat < 3 ||
      beat > 12 ||
      Math.abs(time - beat) > 0.3 ||
      this.tapped.has(beat)
    )
      return;
    this.tapped.add(beat);
    this.samples.push((time - beat) * 1000);
    this.message.textContent = `${this.samples.length} taps recorded. Keep following the clicks.`;
  }
  frame() {
    if (!this.running) return;
    const time = this.time;
    this.ring.classList.toggle(
      "pulse",
      time >= 1 && time <= 12.1 && time % 1 < 0.1,
    );
    if (time >= 12.5) {
      const sorted = [...this.samples].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2
          ? sorted[middle]
          : (sorted[middle - 1] + sorted[middle]) / 2;
      this.stop();
      if (sorted.length < 5) {
        this.message.textContent = "At least five taps are needed. Try again.";
        return;
      }
      const offset = Math.round(median / 5) * 5;
      this.message.textContent = `Suggested offset: ${offset >= 0 ? "+" : ""}${offset} ms from ${sorted.length} taps. Repeat to confirm.`;
      this.onComplete(offset);
    }
  }
  stop() {
    this.generation++;
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    this.running = false;
    this.ring.classList.remove("pulse");
  }
}
