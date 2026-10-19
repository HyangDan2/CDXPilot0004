// These scores are shared by the audio renderer and the chart authoring script.
export const TRACKS = [
  {
    id: "neon-galaxy",
    title: "Neon Galaxy",
    bpm: 124,
    root: 57,
    color: "#7be9ff",
    genre: "CELESTIAL SYNTHWAVE",
    description: "Warm analog chords. A neon horizon.",
    motif: [0, 7, 12, 10, 7, 3, 5, 7],
    chords: [0, -5, -2, -7],
    seed: 11,
    tone: 0,
  },
  {
    id: "violet-drift",
    title: "Violet Drift",
    bpm: 100,
    root: 54,
    color: "#bd9aff",
    genre: "ORBITAL DOWNTEMPO",
    description: "Weightless bells in a violet dusk.",
    motif: [12, 7, 3, 10, 5, 7, 0, 3],
    chords: [0, -2, -5, 3],
    seed: 23,
    tone: 1,
  },
  {
    id: "solar-rush",
    title: "Solar Rush",
    bpm: 140,
    root: 60,
    color: "#ffb56c",
    genre: "SOLAR ELECTRO",
    description: "Bright pulses. Full-throttle ascent.",
    motif: [0, 0, 7, 12, 10, 7, 5, 3],
    chords: [0, 3, -5, -2],
    seed: 37,
    tone: 2,
  },
  {
    id: "deep-orbit",
    title: "Deep Orbit",
    bpm: 112,
    root: 50,
    color: "#62efcd",
    genre: "DEEP SPACE HOUSE",
    description: "A rolling bassline beyond the stars.",
    motif: [0, 3, 7, 5, 12, 10, 7, 3],
    chords: [0, -7, -5, -2],
    seed: 53,
    tone: 3,
  },
  {
    id: "starlight-engine",
    title: "Starlight Engine",
    bpm: 132,
    root: 59,
    color: "#ff8ad5",
    genre: "PRISMATIC TRANCE",
    description: "Shimmering arpeggios. Infinite motion.",
    motif: [0, 7, 3, 12, 7, 15, 10, 7],
    chords: [0, -5, 3, -2],
    seed: 71,
    tone: 4,
  },
  {
    id: "pixel-sunrise",
    title: "Pixel Sunrise",
    bpm: 168,
    root: 60,
    color: "#a2f5ff",
    genre: "FORMANT ELECTROPOP",
    description: "Digital syllables and a bright arcade chorus.",
    motif: [0, 4, 7, 12, 11, 7, 9, 4],
    chords: [0, -5, 2, -3],
    seed: 89,
    tone: 5,
    style: "electro",
    sections: [8, 32, 56, 70, 106],
  },
  {
    id: "velvet-satellite",
    title: "Velvet Satellite",
    bpm: 118,
    root: 58,
    color: "#e3a2ff",
    genre: "DREAM DANCE POP",
    description: "Airy bells, soft harmony, and a floating groove.",
    motif: [7, 11, 14, 9, 4, 7, 2, 11],
    chords: [0, -2, -5, 2],
    seed: 101,
    tone: 6,
    style: "dream",
    sections: [12, 36, 60, 78, 108],
  },
  {
    id: "chrome-heart",
    title: "Chrome Heart",
    bpm: 104,
    root: 55,
    color: "#ffa0b7",
    genre: "MILLENNIUM DANCE POP",
    description: "Punchy brass, syncopated bass, and answering leads.",
    motif: [0, 3, 0, 7, 5, 3, 10, 7],
    chords: [0, -5, -2, -7],
    seed: 113,
    tone: 7,
    style: "dance",
    sections: [6, 30, 54, 72, 104],
  },
  {
    id: "comet-riot",
    title: "Comet Riot",
    bpm: 156,
    root: 52,
    color: "#ffb36c",
    genre: "SYNTH GUITAR ROCK",
    description: "Overdriven power chords and tumbling drum fills.",
    motif: [0, 7, 12, 7, 3, 5, 10, 7],
    chords: [0, 3, -5, -2],
    seed: 127,
    tone: 8,
    style: "rock",
    sections: [10, 34, 58, 74, 110],
  },
  {
    id: "rainfall-circuit",
    title: "Rainfall Circuit",
    bpm: 172,
    root: 57,
    color: "#8edcb8",
    genre: "PIANO DRUM AND BASS",
    description: "Falling piano notes above a broken-beat engine.",
    motif: [12, 7, 3, 10, 14, 7, 5, 3],
    chords: [0, -5, 3, -2],
    seed: 139,
    tone: 9,
    style: "dnb",
    sections: [16, 40, 64, 80, 112],
  },
].map((track) => ({
  ...track,
  duration: 120,
  artist: "Particle Beat Synth Lab",
  audio: `./assets/music/rendered-v3/${track.id}.mp3`,
  synthesis: "web-audio-v3",
}));
export function sectionAt(time, track) {
  if (track?.sections) {
    const index = track.sections.findIndex((end) => time < end);
    return ["INTRO", "ASCENT", "CHORUS", "DRIFT", "SUPERNOVA", "OUTRO"][
      index < 0 ? 5 : index
    ];
  }
  if (time < 12) return "INTRO";
  if (time < 40) return "ASCENT";
  if (time < 64) return "CHORUS";
  if (time < 80) return "DRIFT";
  if (time < 108) return "SUPERNOVA";
  return "OUTRO";
}
export function compose(track) {
  const beat = 60 / track.bpm,
    events = [],
    cues = [];
  const add = (voice, b, midi, duration, gain, pan = 0) =>
    events.push({ voice, time: b * beat, midi, duration, gain, pan });
  for (let b = 0; b * beat < track.duration - 1; b += 0.5) {
    const time = b * beat,
      section = sectionAt(time, track),
      step = Math.round(b * 2),
      bar = Math.floor(b / 4);
    const chord = track.chords[Math.floor(bar / 2) % 4];
    const quiet =
      section === "INTRO" || section === "DRIFT" || section === "OUTRO";
    const melody =
      track.root +
      chord +
      track.motif[(step + Math.floor(bar / 8) * 2) % track.motif.length];
    if (b % 4 === 0)
      for (const interval of [0, 3, 7])
        add(
          "pad",
          b,
          track.root + chord + interval,
          beat * 4.5,
          quiet ? 0.055 : 0.04,
          interval === 0 ? -0.5 : 0.5,
        );
    if (b % 1 === 0) {
      if (
        (section !== "DRIFT" || b % 4 === 0) &&
        (track.style === "dnb"
          ? b % 4 === 0 || b % 4 === 2
          : track.style === "dance"
            ? b % 4 !== 3
            : true)
      )
        add("kick", b, 36, 0.3, quiet ? 0.32 : 0.48);
      add("bass", b, track.root + chord - 24, beat * 0.7, quiet ? 0.12 : 0.2);
      if (b % 2 === 1 && section !== "INTRO") add("snare", b, 0, 0.16, 0.13);
    }
    if ((!quiet || b % 1 === 0.5) && (track.style !== "dream" || b % 1 === 0.5))
      add("hat", b, 0, 0.065, b % 1 ? 0.045 : 0.026, b % 1 ? 0.5 : -0.5);
    if (b >= 8 && time < 116 && (!quiet || b % 1 === 0)) {
      add(
        "lead",
        b,
        melody,
        beat * 0.75,
        quiet ? 0.11 : 0.145,
        Math.sin(step) * 0.35,
      );
      cues.push({ time, beat: b, pitch: melody, section });
      // Quiet stereo echoes are audible but never introduce additional chart targets.
      if (!quiet) add("echo", b + 0.75, melody, beat * 0.55, 0.035, -0.5);
    }
  }
  // Sixteenth-note lead fills are shared by every soundtrack difficulty.
  for (let b = 8.25; b * beat < 116; b += 0.5) {
    const time = b * beat,
      section = sectionAt(time, track),
      bar = Math.floor(b / 4);
    if (!["CHORUS", "SUPERNOVA"].includes(section) || bar % 4 >= 2) continue;
    const pitch =
      track.root +
      track.chords[Math.floor(bar / 2) % 4] +
      track.motif[Math.floor(b * 4) % track.motif.length] +
      12;
    add("lead", b, pitch, beat * 0.3, 0.1, 0.35);
    cues.push({ time, beat: b, pitch, section, expert: true });
  }
  // Sparse extra offbeats make the new EXPERT tier harder without changing lower tiers.
  for (let b = 8.25; b * beat < 116; b += 0.5) {
    const time = b * beat,
      section = sectionAt(time, track),
      bar = Math.floor(b / 4);
    if (!["ASCENT", "CHORUS", "SUPERNOVA"].includes(section) || bar % 4 < 2)
      continue;
    const pitch = track.root + track.motif[Math.floor(b * 4) % 8] + 12;
    add("lead", b, pitch, beat * 0.3, 0.085, -0.35);
    cues.push({ time, beat: b, pitch, section, extreme: true });
  }
  if (track.style === "rock")
    for (let b = 0; b * beat < 118; b += 4) {
      for (const interval of [0, 7, 12])
        add(
          "guitar",
          b,
          track.root - 12 + interval,
          beat * 3.5,
          0.045,
          interval === 0 ? -0.6 : 0.6,
        );
    }
  if (track.style === "dream")
    for (let b = 8; b * beat < 116; b += 2) {
      add(
        "bell",
        b,
        track.root + 19 + (Math.floor(b / 8) % 3) * 2,
        beat * 1.8,
        0.075,
        0.6,
      );
    }
  if (track.style === "dance")
    for (let b = 8.75; b * beat < 116; b += 2) {
      add("bass", b, track.root - 24, beat * 0.4, 0.18);
    }
  if (track.style === "dnb")
    for (let b = 8.75; b * beat < 116; b += 2) {
      add("kick", b, 36, 0.22, 0.3);
      add("snare", b + 0.5, 0, 0.12, 0.09);
    }
  cues.sort((a, b) => a.time - b.time);
  return { events: events.sort((a, b) => a.time - b.time), cues };
}
// Revision 4 also separates records earned before source-aware ribbon judgement.
export const CHART_VERSION = "4";
export function makeChart(track, lanes, difficulty) {
  const { cues } = compose(track),
    notes = [];
  const tier = {
    easy: "normal",
    normal: "hard",
    hard: "expert",
    expert: "extreme",
  }[difficulty];
  let index = 0,
    previousLane = -1;
  for (const cue of cues) {
    if (cue.extreme && tier !== "extreme") continue;
    if (cue.expert && !["expert", "extreme"].includes(tier)) continue;
    if (
      tier === "normal" &&
      cue.beat % 1 !== 0 &&
      !(cue.section === "SUPERNOVA" && cue.beat % 2 === 0.5)
    )
      continue;
    let lane = (index + Math.floor(index / lanes) + track.seed) % lanes;
    if (lane === previousLane) lane = (lane + 1) % lanes;
    notes.push({ time: Number(cue.time.toFixed(6)), lane });
    if (cue.beat % (tier === "normal" ? 8 : 4) === 0 && cue.section !== "DRIFT")
      notes.push({
        time: Number(cue.time.toFixed(6)),
        lane: (lane + lanes / 2) % lanes,
      });
    previousLane = lane;
    index++;
  }
  // Replace isolated melody windows with one adjacent-lane ribbon. No competing TAPs.
  if (difficulty === "expert") {
    let group = 0;
    for (const startBeat of [32, 64, 96, 128, 160, 192, 224, 256, 288]) {
      const selected = cues.filter(
        (c) =>
          c.beat >= startBeat && c.beat <= startBeat + 2 && c.beat % 1 === 0,
      );
      if (selected.length !== 3 || selected.at(-1).time > 114) continue;
      const start = selected[0].time,
        end = selected.at(-1).time;
      for (let i = notes.length - 1; i >= 0; i--)
        if (notes[i].time >= start - 0.18 && notes[i].time <= end + 0.18)
          notes.splice(i, 1);
      const left = group % (lanes - 2),
        path =
          group % 2 ? [left + 2, left + 1, left] : [left, left + 1, left + 2];
      selected.forEach((cue, step) =>
        notes.push({
          time: Number(cue.time.toFixed(6)),
          lane: path[step],
          type: "drag",
          group: "ribbon-" + group,
          step,
        }),
      );
      group++;
    }
  }
  return {
    id: track.id + "-" + lanes + "-" + difficulty,
    trackId: track.id,
    version: CHART_VERSION,
    title: track.title,
    artist: track.artist,
    bpm: track.bpm,
    duration: track.duration,
    audio: track.audio,
    offsetMs: 0,
    lanes,
    difficulty,
    notes: notes.sort((a, b) => a.time - b.time || a.lane - b.lane),
  };
}
