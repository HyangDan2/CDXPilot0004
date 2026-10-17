import { TRACKS } from "./music.js";
export class AudioEngine {
  constructor() {
    this.context = null;
    this.source = null;
    this.position = 0;
    this.playing = false;
    this.cachedKey = null;
    this.bands = { bass: 0, mid: 0, high: 0 };
  }
  async activate() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.gain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.sfxGain.connect(this.gain);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.72;
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.gain);
      this.gain.connect(this.context.destination);
      this.spectrum = new Uint8Array(this.analyser.frequencyBinCount);
    }
    await this.context.resume();
  }
  get time() {
    return this.playing
      ? this.position + Math.max(0, this.context.currentTime - this.startedAt)
      : this.position;
  }
  set volume(value) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, value));
  }
  set musicVolume(value) {
    if (this.musicGain) this.musicGain.gain.value = value;
  }
  set sfxVolume(value) {
    if (this.sfxGain) this.sfxGain.gain.value = value;
  }
  // Prefetch bytes on selection; decode only after the user activates audio.
  prefetch(chart) {
    const track = TRACKS.find((t) => t.id === chart.trackId);
    const url = track?.audio || chart.audio;
    if (!url) return Promise.resolve(null);
    if (this.cachedKey === url && this.buffer) return Promise.resolve(null);
    if (this.pendingUrl === url && this.pendingBytes) return this.pendingBytes;
    this.fetchController?.abort();
    const controller = new AbortController();
    this.fetchController = controller;
    this.pendingUrl = url;
    const timeout = setTimeout(() => controller.abort(), 30000);
    this.pendingBytes = fetch(new URL(url, new URL("../", import.meta.url)), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(
            "Soundtrack download failed (" +
              response.status +
              "). Retry START.",
          );
        return response.arrayBuffer();
      })
      .catch((error) => {
        if (this.fetchController === controller) {
          this.pendingUrl = null;
          this.pendingBytes = null;
        }
        throw new Error(
          error.name === "AbortError"
            ? "Soundtrack download timed out or was cancelled. Retry START."
            : error.message,
        );
      })
      .finally(() => clearTimeout(timeout));
    return this.pendingBytes;
  }
  async prepare(chart, onProgress = () => {}) {
    this.stop();
    const track = TRACKS.find((t) => t.id === chart.trackId);
    const key = track?.audio || chart.audio || chart.id;
    if (this.cachedKey === key && this.buffer) return;
    this.buffer = null;
    this.cachedKey = null;
    this.fallback = !track && !chart.audio;
    if (this.fallback) {
      this.buffer = this.synthesize(chart);
    } else {
      if (!track?.audio && !chart.audio)
        throw new Error("This soundtrack has no saved audio file.");
      onProgress("Loading saved soundtrack…");
      const bytes = await this.prefetch(chart);
      onProgress("Decoding saved soundtrack…");
      let timeout;
      try {
        this.buffer = await Promise.race([
          this.context.decodeAudioData(bytes.slice(0)),
          new Promise((_, reject) => {
            timeout = setTimeout(
              () =>
                reject(
                  new Error("Soundtrack decoding timed out. Retry START."),
                ),
              20000,
            );
          }),
        ]);
        if (
          chart.duration &&
          Math.abs(this.buffer.duration - chart.duration) > 0.1
        ) {
          this.buffer = null;
          throw new Error("Soundtrack duration does not match the chart.");
        }
      } catch (error) {
        this.pendingUrl = null;
        this.pendingBytes = null;
        throw new Error(
          "Unable to decode saved soundtrack. Retry START. " + error.message,
        );
      } finally {
        clearTimeout(timeout);
      }
    }
    this.cachedKey = key;
    this.pendingBytes = null;
    this.pendingUrl = null;
    onProgress("Soundtrack ready.");
  }
  synthesize(chart) {
    const rate = this.context.sampleRate,
      duration = chart.notes.at(-1).time + chart.offsetMs / 1000 + 2;
    const buffer = this.context.createBuffer(
        1,
        Math.ceil(duration * rate),
        rate,
      ),
      data = buffer.getChannelData(0);
    for (const note of chart.notes)
      for (let i = 0; i < rate * 0.2; i++) {
        const at = Math.round((note.time + chart.offsetMs / 1000) * rate) + i,
          t = i / rate;
        if (at < data.length)
          data[at] +=
            Math.sin(
              2 * Math.PI * [262, 330, 392, 523, 587, 659][note.lane] * t,
            ) *
            0.2 *
            Math.exp(-t * 18) *
            Math.min(1, t / 0.004);
      }
    return buffer;
  }
  play(when = this.context.currentTime) {
    if (this.playing) return;
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.musicGain || this.gain);
    this.startedAt = when;
    this.source.start(
      this.startedAt,
      Math.min(this.position, this.buffer.duration),
    );
    this.playing = true;
  }
  pause() {
    if (!this.playing) return;
    this.position = this.time;
    this.playing = false;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
  }
  stop() {
    this.pause();
    this.position = 0;
  }
  energy() {
    if (!this.analyser || !this.playing) {
      this.bands.bass = 0;
      this.bands.mid = 0;
      this.bands.high = 0;
      return this.bands;
    }
    this.analyser.getByteFrequencyData(this.spectrum);
    const average = (low, high) => {
      const start = Math.max(
        1,
        Math.floor((low * this.analyser.fftSize) / this.context.sampleRate),
      );
      const end = Math.min(
        this.spectrum.length,
        Math.ceil((high * this.analyser.fftSize) / this.context.sampleRate),
      );
      let sum = 0;
      for (let i = start; i < end; i++) sum += this.spectrum[i];
      return sum / Math.max(1, end - start) / 255;
    };
    this.bands.bass = average(40, 200);
    this.bands.mid = average(200, 2400);
    this.bands.high = average(2400, 10000);
    return this.bands;
  }
  diagnostics() {
    const stamp = this.context?.getOutputTimestamp?.();
    return {
      contextState: this.context?.state || "closed",
      songTime: this.time,
      contextTime: this.context?.currentTime || 0,
      baseLatencyMs: (this.context?.baseLatency || 0) * 1000,
      outputLatencyMs: (this.context?.outputLatency || 0) * 1000,
      outputContextTime: stamp?.contextTime || 0,
      playing: this.playing,
    };
  }
}
