import { classify, nearestNote } from "../js/judgement.js";
import { validateBeatmap } from "../js/beatmap.js";
import { Game } from "../js/game.js";
import { grade } from "../js/config.js";
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
}
function equal(actual, expected) {
  if (actual !== expected)
    throw new Error(`Expected ${expected}, received ${actual}`);
}
function throws(fn) {
  let thrown = false;
  try {
    fn();
  } catch {
    thrown = true;
  }
  equal(thrown, true);
}
const chart = {
  id: "test",
  title: "Test",
  artist: "Test",
  bpm: 128,
  offsetMs: 0,
  notes: [
    { time: 1, lane: 0 },
    { time: 1, lane: 1 },
    { time: 2, lane: 0 },
  ],
};
test("Inclusive judgement boundaries on both sides", () => {
  for (const sign of [-1, 1]) {
    equal(classify(sign * 0.05), "PERFECT");
    equal(classify(sign * 0.0501), "GOOD");
    equal(classify(sign * 0.12), "GOOD");
    equal(classify(sign * 0.1201), "MISS");
    equal(classify(sign * 0.18), "MISS");
    equal(classify(sign * 0.1801), null);
  }
});
test("Nearest eligible note wins", () => {
  const notes = [
    { at: 1, lane: 0 },
    { at: 1.2, lane: 0 },
  ];
  equal(nearestNote(notes, 0, 1.15), notes[1]);
  notes[1].done = true;
  equal(nearestNote(notes, 0, 1.15), notes[0]);
  equal(nearestNote(notes, 1, 1), null);
});
test("Chord input is independent and notes cannot score twice", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  g.hit(1, 1);
  g.hit(0, 1);
  equal(g.score, 2000);
  equal(g.combo, 2);
  equal(g.counts.PERFECT, 2);
});
test("Late notes miss exactly once and clear combo", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  g.update(1.181);
  g.update(1.3);
  equal(g.counts.MISS, 1);
  equal(g.combo, 0);
  equal(g.maximumCombo, 1);
});
test("Input MISS consumes a note, empty input does not penalize", () => {
  const g = new Game(chart);
  g.hit(3, 0);
  equal(g.counts.MISS, 0);
  g.hit(0, 0.85);
  equal(g.counts.MISS, 1);
  g.hit(0, 1);
  equal(g.score, 0);
});
test("Positive input offset compensates late input and expiry", () => {
  const g = new Game(chart, 100);
  equal(g.hit(0, 1.1), "PERFECT");
  g.update(1.25);
  equal(g.counts.MISS, 0);
  g.update(1.281);
  equal(g.counts.MISS, 1);
});
test("Chart offset shifts targets without mutating source", () => {
  const g = new Game({ ...chart, offsetMs: 200 });
  equal(g.notes[0].at, 1.2);
  equal(chart.notes[0].time, 1);
  equal(g.hit(0, 1.2), "PERFECT");
});
test("Restart creates clean state", () => {
  const first = new Game(chart);
  first.hit(0, 1);
  const second = new Game(chart);
  equal(second.score, 0);
  equal(second.notes[0].done, false);
  equal(second.feedback, null);
});
test("Accuracy uses the complete chart maximum", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  g.hit(1, 1.1);
  g.update(3);
  equal(g.score, 1500);
  equal(g.accuracy, 50);
  equal(g.complete, true);
  equal(g.grade, "D");
});
test("Grade thresholds are inclusive", () => {
  equal(grade(95), "S");
  equal(grade(90), "A");
  equal(grade(80), "B");
  equal(grade(70), "C");
  equal(grade(69.99), "D");
});
test("Validation sorts without mutating input", () => {
  const data = {
    ...chart,
    notes: [
      { time: 2, lane: 0 },
      { time: 1, lane: 0 },
    ],
  };
  equal(validateBeatmap(data).notes[0].time, 1);
  equal(data.notes[0].time, 2);
});
test("Validation rejects bad chart data", () => {
  for (const notes of [
    [],
    [{ time: NaN, lane: 0 }],
    [{ time: -1, lane: 0 }],
    [{ time: 1, lane: 4 }],
    [{ time: 1, lane: 0.5 }],
    [
      { time: 1, lane: 0 },
      { time: 1, lane: 0 },
    ],
  ])
    throws(() => validateBeatmap({ ...chart, notes }));
  throws(() => validateBeatmap({ ...chart, bpm: 0 }));
  throws(() => validateBeatmap({ ...chart, offsetMs: -2000 }));
  throws(() => validateBeatmap({ ...chart, audio: 123 }));
});
if (typeof document !== "undefined") {
  document.getElementById("results").textContent = results
    .map(
      (r) =>
        `${r.passed ? "PASS" : "FAIL"}  ${r.name}${r.error ? " — " + r.error : ""}`,
    )
    .join("\n");
  document.getElementById("summary").textContent =
    `${results.filter((r) => r.passed).length}/${results.length} checks passed`;
} else {
  for (const r of results)
    console.log(
      `${r.passed ? "PASS" : "FAIL"} ${r.name}${r.error ? " — " + r.error : ""}`,
    );
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
export { results };
