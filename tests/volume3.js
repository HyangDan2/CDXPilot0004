import { Game } from "../js/game.js";
import { validateBeatmap } from "../js/beatmap.js";
import { HighScores, scoreKey, cleanName } from "../js/highscores.js";
import { sanitizeSettings } from "../js/settings.js";
const assert = (v, m) => {
  if (!v) throw new Error(m);
};
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
}
const chart = {
  id: "ribbon",
  trackId: "track",
  version: "3",
  title: "Test",
  artist: "Test",
  bpm: 120,
  duration: 10,
  offsetMs: 0,
  lanes: 4,
  difficulty: "expert",
  notes: [0, 1, 2].map((lane, step) => ({
    time: 1 + step,
    lane,
    type: "drag",
    group: "a",
    step,
  })),
};
test("Connected ribbon, overlap, and grace score once", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  g.hit(1, 2);
  g.release(0, 2.02);
  g.release(1, 2.94);
  g.hit(2, 3);
  g.hit(2, 3);
  assert(g.score === 3000 && g.combo === 3, "Connected checkpoints");
});
test("Early release cannot be repaired by repressing just before a checkpoint", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  g.release(0, 1.1);
  g.hit(0, 1.9);
  g.release(0, 1.99);
  g.hit(1, 2);
  assert(g.counts.MISS === 1, "Early break must persist");
  g.hit(2, 3);
  assert(g.counts.PERFECT === 2 && g.score === 2000, "Re-anchor and recover");
});
test("Missed start recovers at a later checkpoint", () => {
  const g = new Game(chart);
  g.update(1.2);
  g.hit(1, 2);
  g.hit(2, 3);
  assert(
    g.counts.MISS === 1 && g.score === 2000,
    "Recover without cascading misses",
  );
});
test("Pause requires re-holding the anchor during count-in", () => {
  const g = new Game(chart);
  g.hit(0, 1);
  g.suspendInputs();
  g.resumeInputs(new Set([0]), 1.5);
  g.hit(1, 2);
  assert(g.score === 2000, "Re-held connection");
  const b = new Game(chart);
  b.hit(0, 1);
  b.suspendInputs();
  b.resumeInputs(new Set(), 1.5);
  b.hit(1, 2);
  assert(b.counts.MISS === 1, "No re-hold breaks connection");
});
test("Ribbon metadata validation rejects non-expert and conflicts", () => {
  validateBeatmap(chart);
  for (const bad of [
    { ...chart, difficulty: "hard" },
    { ...chart, notes: [...chart.notes, { time: 2, lane: 3 }] },
    {
      ...chart,
      notes: chart.notes.map((n, i) => ({ ...n, lane: i === 1 ? 3 : n.lane })),
    },
  ]) {
    let failed = false;
    try {
      validateBeatmap(bad);
    } catch {
      failed = true;
    }
    assert(failed, "Reject invalid ribbon");
  }
});
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
  };
};
const row = (id, score, key = "board") => ({
  id,
  key,
  score,
  accuracy: 50,
  combo: 10,
  date: "2026-10-17T10:00:00.000Z",
});
test("High score, tie order, top ten and duplicate save", () => {
  const store = memory(),
    h = new HighScores(store);
  for (let i = 0; i < 12; i++) h.save(row("r" + i, 100 + i), "P" + i);
  assert(
    h.table("board").length === 10 && h.table("board")[0].score === 111,
    "Top ten",
  );
  assert(
    !h.isBest("board", 111) && h.isBest("board", 112),
    "Strict record improvement",
  );
  h.save(row("equal", 111), "TIE");
  assert(h.table("board")[0].id === "r11", "Existing tie stays ahead");
  h.save(row("equal", 111), "OTHER");
  assert(
    h.table("board").filter((r) => r.id === "equal").length === 1,
    "No duplicate run",
  );
  const reload = new HighScores(store);
  assert(
    reload.table("board").length === 10 && reload.lastName === "TIE",
    "Reload and last name",
  );
});
test("Boards separate modes, lanes and chart revisions", () => {
  const keys = [
    scoreKey(chart, "standard"),
    scoreKey(chart, "free"),
    scoreKey({ ...chart, lanes: 6 }, "standard"),
    scoreKey({ ...chart, version: "4" }, "standard"),
    scoreKey(
      { ...chart, notes: [...chart.notes, { time: 4, lane: 2 }] },
      "standard",
    ),
  ];
  assert(new Set(keys).size === 5, "Independent leaderboards");
});
test("Names are bounded and storage failure preserves session records", () => {
  assert(Array.from(cleanName("abcdefghijklmnop")).length === 12, "Name bound");
  assert(cleanName("  ") === "PLAYER", "Skipped name");
  const h = new HighScores({
    getItem: () => "{broken",
    setItem() {
      throw new Error("quota");
    },
  });
  const result = h.save(row("one", 400), "A<script>");
  assert(!result.ok && h.table("board").length === 1, "Session fallback");
  assert(!h.table("board")[0].name.includes("<"), "Safe name");
  h.save(row("one", 400), "again");
  assert(h.table("board").length === 1, "Retry save deduplication");
});
test("Speed supports ten and quantizes to quarter steps", () => {
  assert(
    sanitizeSettings({ speed: 10 }).speed === 10 &&
      sanitizeSettings({ speed: 20 }).speed === 10 &&
      sanitizeSettings({ speed: 0.1 }).speed === 0.5 &&
      sanitizeSettings({ speed: 3.17 }).speed === 3.25,
    "Validated range",
  );
});
if (typeof document !== "undefined")
  document.getElementById("volume3-results").textContent = results
    .map(
      (r) =>
        `${r.passed ? "PASS" : "FAIL"} ${r.name}${r.error ? " — " + r.error : ""}`,
    )
    .join("\n");
else {
  results.forEach((r) =>
    console.log(
      `${r.passed ? "PASS" : "FAIL"} ${r.name}${r.error ? " — " + r.error : ""}`,
    ),
  );
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
export { results };
