import { DIFFICULTIES } from "./config.js";
export function validateBeatmap(data) {
  if (
    !data ||
    typeof data.id !== "string" ||
    !data.id.trim() ||
    typeof data.title !== "string" ||
    !data.title.trim() ||
    typeof data.artist !== "string"
  )
    throw new Error("Track identity is incomplete.");
  if (
    !Number.isFinite(data.bpm) ||
    data.bpm <= 0 ||
    !Number.isFinite(data.offsetMs)
  )
    throw new Error("Invalid BPM or chart offset.");
  if (data.audio != null && typeof data.audio !== "string")
    throw new Error("Audio must be a path or null.");
  if (!Array.isArray(data.notes) || !data.notes.length)
    throw new Error("A track must contain notes.");
  const lanes = data.lanes ?? 4;
  if (![4, 6].includes(lanes))
    throw new Error("Only four or six lanes are supported.");
  if (data.difficulty != null && !DIFFICULTIES.includes(data.difficulty))
    throw new Error("Unknown difficulty.");
  if (
    data.duration != null &&
    (!Number.isFinite(data.duration) || data.duration <= 0)
  )
    throw new Error("Invalid track duration.");
  const seen = new Set(),
    groups = new Map();
  const notes = data.notes
    .map((note) => {
      if (
        !Number.isFinite(note.time) ||
        note.time < 0 ||
        !Number.isInteger(note.lane) ||
        note.lane < 0 ||
        note.lane >= lanes ||
        note.time + data.offsetMs / 1000 < 0
      )
        throw new Error("Invalid note time or lane.");
      if (
        data.duration != null &&
        note.time + data.offsetMs / 1000 + 0.18 >= data.duration
      )
        throw new Error("Note extends past duration.");
      const key = note.time + ":" + note.lane;
      if (seen.has(key)) throw new Error("Duplicate note.");
      seen.add(key);
      if (note.type != null && !["tap", "drag", "hold"].includes(note.type))
        throw new Error("Unknown note type.");
      if (note.type === "drag" || note.type === "hold") {
        if (
          (data.difficulty !== "expert" && !(note.type === "hold" && data.difficulty === "hard" && data.holdTier === "hard")) ||
          typeof note.group !== "string" ||
          !note.group ||
          !Number.isInteger(note.step) ||
          note.step < 0
        )
          throw new Error("Invalid sustained-note difficulty or metadata.");
        const copy = {
          time: note.time,
          lane: note.lane,
          type: note.type,
          group: note.group,
          step: note.step,
        };
        if (!groups.has(note.group)) groups.set(note.group, []);
        groups.get(note.group).push(copy);
        return copy;
      }
      return { time: note.time, lane: note.lane };
    })
    .sort((a, b) => a.time - b.time || a.lane - b.lane);
  const intervals = [];
  const chordSizes = new Map();
  for (const note of notes) {
    const size = (chordSizes.get(note.time) || 0) + 1;
    if (size > 2) throw new Error("Chords may contain at most two notes.");
    chordSizes.set(note.time, size);
  }
  for (const [id, points] of groups) {
    points.sort((a, b) => a.step - b.step);
    const isHold = points[0].type === "hold";
    if (points.length < 2)
      throw new Error("A ribbon needs at least two checkpoints.");
    points.forEach((point, i) => {
      if (
        point.step !== i || point.type !== points[0].type ||
        (i > 0 &&
          (point.time <= points[i - 1].time ||
            (isHold ? point.lane !== points[0].lane : Math.abs(point.lane - points[i - 1].lane) !== 1)))
      )
        throw new Error("Invalid ribbon order or adjacency.");
    });
    const start = points[0].time,
      end = points.at(-1).time;
    if (!isHold &&
      notes.some(
        (n) => n.group !== id && n.time >= start - 0.18 && n.time <= end + 0.18,
      )
    )
      throw new Error("Competing notes overlap a ribbon.");
    if (isHold) {
      const taps = new Map();
      for (const note of notes) {
        if (note.group === id || note.time < start - 0.18 || note.time > end + 0.18) continue;
        if (note.type === "hold" || note.type === "drag" || note.lane === points[0].lane)
          throw new Error("A HOLD cannot overlap another sustained note or a same-lane TAP.");
        const size = (taps.get(note.time) || 0) + 1;
        if (size > 1) throw new Error("A HOLD permits only one simultaneous companion TAP.");
        taps.set(note.time, size);
      }
    }
    if (intervals.some(([a, b]) => start <= b && end >= a))
      throw new Error("Overlapping ribbons.");
    intervals.push([start, end]);
  }
  return { ...data, lanes, notes };
}
export async function loadBeatmap(path) {
  const response = await fetch(path);
  if (!response.ok)
    throw new Error(`Cannot load beatmap (${response.status}).`);
  return validateBeatmap(await response.json());
}
