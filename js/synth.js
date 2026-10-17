import { compose } from "./music.js";
// All instruments are local Web Audio nodes; no samples or network calls are used.
export async function renderTrack(
  track,
  onProgress = () => {},
  Context = globalThis.OfflineAudioContext,
) {
  if (!Context)
    throw new Error("This browser does not support OfflineAudioContext.");
  const sampleRate = 32000,
    length = sampleRate * track.duration;
  const channels = [new Float32Array(length), new Float32Array(length)];
  const events = compose(track).events;
  // Four seconds of warm-up preserve every voice/reverb tail across boundaries.
  // Only the non-overlapping ten-second core of each window is retained.
  const maxTail =
    Math.max(...events.map((e) => e.duration)) + (60 / track.bpm) * 0.75;
  if (maxTail >= 4)
    throw new Error("Increase render warm-up for this arrangement.");
  for (let start = 0; start < track.duration; start += 10) {
    const from = Math.max(0, start - 4),
      to = Math.min(track.duration, start + 10);
    onProgress(
      "Rendering soundtrack… " +
        Math.round((start / track.duration) * 100) +
        "%",
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    const part = await renderWindow(track, events, from, to, Context);
    for (let c = 0; c < 2; c++)
      channels[c].set(
        part.getChannelData(c).subarray((start - from) * sampleRate),
        start * sampleRate,
      );
  }
  for (const data of channels)
    for (let i = 0; i < length; i++)
      data[i] =
        Math.tanh(data[i] * 1.6) *
        Math.min(
          1,
          i / sampleRate / 0.03,
          (track.duration - i / sampleRate) / 3,
        );
  onProgress("Soundtrack ready.");
  return {
    numberOfChannels: 2,
    sampleRate,
    length,
    duration: track.duration,
    getChannelData: (c) => channels[c],
  };
}
async function renderWindow(track, allEvents, from, to, Context) {
  const sampleRate = 32000;
  const context = new Context(
    2,
    Math.round(sampleRate * (to - from)),
    sampleRate,
  );
  const master = context.createGain();
  master.gain.value = 0.75;
  master.connect(context.destination);
  const echo = context.createDelay(1);
  echo.delayTime.value = (60 / track.bpm) * 0.75;
  const echoGain = context.createGain();
  echoGain.gain.value = 0.13;
  echo.connect(echoGain);
  echoGain.connect(master);
  const noise = context.createBuffer(1, sampleRate, sampleRate);
  let seed = track.seed;
  const noiseData = noise.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noiseData[i] = seed / 2147483648 - 1;
  }
  const events = allEvents.filter((e) => e.time >= from && e.time < to);
  for (let index = 0; index < events.length; index++) {
    const e = events[index],
      at = e.time - from,
      end = Math.min(track.duration, e.time + e.duration) - from;
    if (end <= at) continue;
    const amp = context.createGain(),
      pan = context.createStereoPanner();
    pan.pan.value = e.pan;
    amp.connect(pan);
    pan.connect(master);
    const release = e.voice === "pad" ? 0.12 : 0.01,
      attack = e.voice === "pad" ? 0.1 : 0.003;
    amp.gain.setValueAtTime(0, at);
    amp.gain.linearRampToValueAtTime(
      e.gain,
      at + Math.min(attack, (end - at) / 4),
    );
    amp.gain.exponentialRampToValueAtTime(
      0.0001,
      Math.max(at + attack + 0.001, end - release),
    );
    amp.gain.linearRampToValueAtTime(0, end);
    if (["hat", "snare"].includes(e.voice)) {
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter();
      source.buffer = noise;
      filter.type = e.voice === "hat" ? "highpass" : "bandpass";
      filter.frequency.value = e.voice === "hat" ? 6500 : 1800;
      filter.Q.value = 0.7;
      source.connect(filter);
      filter.connect(amp);
      source.start(at);
      source.stop(end);
      continue;
    }
    const frequency = 440 * 2 ** ((e.midi - 69) / 12),
      osc = context.createOscillator(),
      filter = context.createBiquadFilter();
    osc.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.value = 5500;
    filter.Q.value = 0.7;
    let output = filter;
    if (e.voice === "kick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, at);
      osc.frequency.exponentialRampToValueAtTime(42, at + 0.12);
      filter.frequency.value = 800;
    } else if (e.voice === "bass") {
      osc.type = track.style === "dance" ? "square" : "sawtooth";
      filter.frequency.setValueAtTime(950, at);
      filter.frequency.exponentialRampToValueAtTime(150, end);
    } else if (e.voice === "pad") {
      osc.type = "triangle";
      filter.frequency.value = 1700;
      const second = context.createOscillator();
      second.type = "triangle";
      second.frequency.value = frequency;
      second.detune.value = 7;
      second.connect(filter);
      second.start(at);
      second.stop(end);
    } else if (e.voice === "guitar" || track.style === "rock") {
      osc.type = "sawtooth";
      const shaper = context.createWaveShaper(),
        curve = new Float32Array(512);
      for (let i = 0; i < 512; i++)
        curve[i] = Math.tanh(((i / 511) * 2 - 1) * 3);
      shaper.curve = curve;
      filter.frequency.value = 2600;
      filter.connect(shaper);
      output = shaper;
    } else if (track.style === "electro") {
      osc.type = "sawtooth";
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, at);
      filter.frequency.linearRampToValueAtTime(1600, end);
      filter.Q.value = 3;
      const formant = context.createBiquadFilter();
      formant.type = "bandpass";
      formant.frequency.value = 2400;
      formant.Q.value = 5;
      osc.connect(formant);
      formant.connect(amp);
    } else if (track.style === "dance") {
      osc.type = "sawtooth";
      filter.frequency.setValueAtTime(3500, at);
      filter.frequency.exponentialRampToValueAtTime(800, end);
      filter.Q.value = 2;
    } else if (
      track.style === "dream" ||
      track.style === "dnb" ||
      e.voice === "bell"
    ) {
      osc.type = "sine";
      const overtone = context.createOscillator(),
        oGain = context.createGain();
      overtone.frequency.value =
        frequency * (track.style === "dnb" ? 2 : 2.003);
      oGain.gain.value = 0.25;
      overtone.connect(oGain);
      oGain.connect(filter);
      overtone.start(at);
      overtone.stop(end);
    } else {
      osc.type = track.tone % 2 ? "triangle" : "sine";
    }
    osc.connect(filter);
    output.connect(amp);
    if (["lead", "bell"].includes(e.voice)) pan.connect(echo);
    osc.start(at);
    osc.stop(end);
  }
  return context.startRendering();
}
