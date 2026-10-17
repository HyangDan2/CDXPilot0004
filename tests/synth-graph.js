import { renderTrack } from "../js/synth.js";
import { TRACKS } from "../js/music.js";
const assert = (v, m) => {
  if (!v) throw new Error(m);
};
let lastContext;
class GraphContext {
  constructor(channels, length, rate) {
    this.channels = channels;
    this.length = length;
    this.sampleRate = rate;
    this.destination = {};
    this.nodes = [];
    lastContext = this;
  }
  param() {
    return {
      value: 0,
      setValueAtTime(v, t) {
        assert(Number.isFinite(v) && t >= 0, "Finite automation");
      },
      linearRampToValueAtTime(v, t) {
        assert(Number.isFinite(v) && t >= 0, "Finite ramp");
      },
      exponentialRampToValueAtTime(v, t) {
        assert(v > 0 && t >= 0, "Positive exponential target");
      },
    };
  }
  node(kind) {
    const node = {
      kind,
      connect() {},
      gain: this.param(),
      frequency: this.param(),
      detune: this.param(),
      Q: this.param(),
      pan: this.param(),
      delayTime: this.param(),
      start(at) {
        this.startAt = at;
        assert(at >= 0, "Start in range");
      },
      stop(at) {
        assert(at >= this.startAt && at <= 120, "Stop inside song");
      },
    };
    this.nodes.push(node);
    return node;
  }
  createGain() {
    return this.node("gain");
  }
  createDelay() {
    return this.node("delay");
  }
  createStereoPanner() {
    return this.node("pan");
  }
  createBufferSource() {
    return this.node("buffer-source");
  }
  createBiquadFilter() {
    return this.node("filter");
  }
  createOscillator() {
    return this.node("oscillator");
  }
  createWaveShaper() {
    return this.node("shaper");
  }
  createBuffer(channels, length, rate) {
    const arrays = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return {
      numberOfChannels: channels,
      length,
      duration: length / rate,
      sampleRate: rate,
      getChannelData: (i) => arrays[i],
    };
  }
  async startRendering() {
    return this.createBuffer(this.channels, this.length, this.sampleRate);
  }
}
for (const track of TRACKS) {
  let notifications = 0;
  const buffer = await renderTrack(track, () => notifications++, GraphContext);
  assert(
    buffer.duration === 120 &&
      buffer.numberOfChannels === 2 &&
      buffer.sampleRate === 32000,
    "Render dimensions",
  );
  assert(notifications > 2, "Preparation feedback");
  assert(
    lastContext.nodes.filter((n) => n.kind === "oscillator").length > 100,
    "Nontrivial arrangement",
  );
  if (track.style === "electro")
    assert(
      lastContext.nodes.some((n) => n.type === "bandpass" && n.Q.value === 5),
      "Formant instrument",
    );
  if (track.style === "rock")
    assert(
      lastContext.nodes.some((n) => n.kind === "shaper"),
      "Distortion instrument",
    );
  console.log(
    `PASS ${track.title}: Web Audio graph scheduling (${lastContext.nodes.length} mock nodes)`,
  );
}
console.log(
  "Graph validation uses a mock OfflineAudioContext; it does not verify browser rendering or sound.",
);
