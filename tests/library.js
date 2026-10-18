import { readFileSync } from "node:fs";
import { TRACKS, compose, makeChart } from "../js/music.js";
import { validateBeatmap } from "../js/beatmap.js";
import { Game } from "../js/game.js";
import { noteY } from "../js/config.js";
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
let count = 0,
  ribbons = 0;
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
          chart.version === "3",
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
        if (note.type === "drag") {
          ribbons += note.step === 0 ? 1 : 0;
          game.hit(note.lane, note.time);
          if (note.step > 0)
            game.release(
              game.dragGroups.get(note.group)[note.step - 1].lane,
              note.time,
            );
          if (note.step === game.dragGroups.get(note.group).length - 1)
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
          (["hard", "expert"].includes(difficulty) && lanes === 6 ? 3 : 2),
        "Chord cap",
      );
      assert(
        game.complete &&
          game.accuracy === 100 &&
          game.maximumCombo === chart.notes.length,
        `Full perfect replay ${chart.id}: ${game.score}`,
      );
      const missed = new Game(chart, 0, "free");
      missed.update(120);
      assert(missed.counts.MISS === chart.notes.length, "Complete miss replay");
      const failed = new Game(chart);
      failed.update(120);
      assert(
        failed.failed &&
          failed.counts.MISS ===
            { easy: 13, normal: 10, hard: 9, expert: 7 }[difficulty],
        "Standard terminal freeze",
      );
      assert(
        difficulty === "expert"
          ? game.dragGroups.size >= 5
          : game.dragGroups.size === 0,
        "EXPERT-only ribbons",
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
assert(TRACKS.length === 10 && count === 80, "Ten tracks and eighty charts");
for (const speed of [0.5, 1, 2, 5, 10])
  assert(noteY(10, 10, 400, speed) === 400, "Speed-independent target");
console.log(
  `PASS ${count} deterministic charts, ${ribbons} ribbons, onset mapping, chord caps, spacing, and full replays`,
);
console.log(JSON.stringify(report, null, 2));
