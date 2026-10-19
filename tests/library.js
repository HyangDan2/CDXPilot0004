import { readFileSync } from "node:fs";
import { TRACKS, compose, makeChart } from "../js/music.js";
import { validateBeatmap } from "../js/beatmap.js";
import { Game } from "../js/game.js";
import { noteY } from "../js/config.js";
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
let count = 0,
  holds = 0;
const report = [];
for (const track of TRACKS) {
  const cues = new Set(compose(track).cues.map((c) => c.time.toFixed(6))),
    totals = {};
  for (const lanes of [4, 6])
    for (const difficulty of ["easy", "normal", "hard", "expert"]) {
      const chart = validateBeatmap(
        JSON.parse(
          readFileSync(
            new URL(
              `../assets/beatmaps/library/${track.id}-${lanes}-${difficulty}.json`,
              import.meta.url,
            ),
          ),
        ),
      );
      assert(
        JSON.stringify(chart) ===
          JSON.stringify(makeChart(track, lanes, difficulty)),
        "Deterministic chart",
      );
      assert(
        chart.duration === 120 &&
          chart.audio === track.audio &&
          chart.version === "6",
        "Web Audio content contract",
      );
      const game = new Game(chart, 0, "free"),
        groups = new Map(),
        last = new Map();
      let gap = Infinity;
      for (const note of chart.notes) {
        assert(cues.has(note.time.toFixed(6)), "Musical onset alignment");
        gap = Math.min(gap, note.time - (last.get(note.lane) ?? -Infinity));
        last.set(note.lane, note.time);
        groups.set(note.time, (groups.get(note.time) || 0) + 1);
        if (note.type === "hold") {
          holds += note.step === 0 ? 1 : 0;
          if (note.step === 0) game.hit(note.lane, note.time);
          else game.update(note.time);
          if (note === game.holdGroups.get(note.group).points.at(-1))
            game.release(note.lane, note.time);
        } else {
          game.hit(note.lane, note.time);
          game.release(note.lane, note.time);
        }
      }
      assert(
        gap >= (["hard", "expert"].includes(difficulty) ? 0.08 : 0.16),
        `Spacing ${track.id} ${difficulty}: ${gap}`,
      );
      assert(
        Math.max(...groups.values()) <=
          2,
        "Chord cap",
      );
      assert(
        game.complete &&
          game.accuracy === 100 &&
          game.maximumCombo === chart.notes.length,
        `Full perfect replay ${chart.id}: ${game.score}`,
      );
      // Count held lanes even between checkpoints, not only notes at the same timestamp.
      for (const time of groups.keys()) {
        const active = [...game.holdGroups.values()].filter(h => h.points[0].time <= time && h.points.at(-1).time >= time);
        const taps = chart.notes.filter(n => n.time === time && n.type !== 'hold');
        assert(active.length <= 1 && active.length + taps.length <= 2, 'Two-finger occupancy');
        assert(!taps.some(n => active.some(h => h.points[0].lane === n.lane)), 'No same-lane hold TAP');
      }
      assert(!chart.notes.some(n => n.type === 'drag'), 'No catalog slide notes');
      const missed = new Game(chart, 0, "free");
      // Replay every chart with source-aware touch handoffs as well as keyboard holds.
      const touchGame = new Game(chart, 0, "free");
      for (const note of chart.notes) {
        if (note.type === "hold") {
          const source = 'pointer:' + note.group;
          if (note.step === 0) touchGame.hit(note.lane, note.time, {kind: 'touch', source});
          else touchGame.update(note.time);
          if (note === touchGame.holdGroups.get(note.group).points.at(-1)) {
            touchGame.releaseSource(source, note.time);
            touchGame.release(note.lane, note.time);
          }
        } else {
          touchGame.hit(note.lane, note.time, { kind: "touch", source: 'pointer:tap-' + note.lane });
          touchGame.release(note.lane, note.time);
        }
      }
      assert(touchGame.complete && touchGame.accuracy === 100, `Touch full replay ${chart.id}`);
      missed.update(120);
      assert(missed.complete && missed.counts.MISS === chart.notes.filter(n => n.type !== "hold" || n.step === 0).length, "Complete miss replay");
      const failed = new Game(chart);
      failed.update(120);
      assert(
        failed.failed &&
          failed.counts.MISS ===
            { easy: 13, normal: 10, hard: 9, expert: 7 }[difficulty],
        "Standard terminal freeze",
      );
      assert(
        (difficulty === "expert" || (track.challenge && difficulty === "hard"))
          ? game.holdGroups.size >= 5
          : game.holdGroups.size === 0,
        "Tier-specific holds",
      );
      totals[`${lanes}-${difficulty}`] = chart.notes.length;
      count++;
    }
  for (const lanes of [4, 6]) {
    const n = ["easy", "normal", "hard", "expert"].map(
      (d) => totals[`${lanes}-${d}`],
    );
    assert(
      n.every((v, i) => i === 0 || v > n[i - 1]),
      "Increasing difficulty density",
    );
  }
  report.push({ track: track.title, notes: totals });
}
assert(TRACKS.length === 20 && count === 160, "Twenty tracks and 160 charts");
for (const difficulty of ["easy", "normal", "hard", "expert"]) {
  const average = tracks => tracks.reduce((sum, track) => sum + makeChart(track, 4, difficulty).notes.length, 0) / tracks.length;
  assert(average(TRACKS.slice(10)) > average(TRACKS.slice(0, 10)), "Challenge collection is denser at every tier");
}
const seeded = TRACKS[10];
assert(JSON.stringify(makeChart(seeded, 4, "expert").notes) !== JSON.stringify(makeChart({...seeded, seed: seeded.seed + 1}, 4, "expert").notes), "Different authoring seeds vary patterns");
for (const speed of [0.5, 1, 2, 5, 10])
  assert(noteY(10, 10, 400, speed) === 400, "Speed-independent target");
console.log(
  `PASS ${count} deterministic charts, ${holds} holds, onset mapping, chord caps, spacing, and full replays`,
);
console.log(JSON.stringify(report, null, 2));
