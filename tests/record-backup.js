import assert from "node:assert/strict";
import { HighScores, scoreKey } from "../js/highscores.js";
const storage = () => ({
  data: null,
  getItem() {
    return this.data;
  },
  setItem(k, v) {
    this.data = v;
  },
});
const chart = {
  id: "test",
  lanes: 4,
  difficulty: "expert",
  version: "3",
  offsetMs: 0,
  notes: [{ time: 1, lane: 0 }],
};
const key = scoreKey(chart, "standard");
const row = (id, score, keyValue = key) => ({
  id,
  key: keyValue,
  score,
  accuracy: 95,
  combo: 9,
  date: "2026-10-18T00:00:00.000Z",
});
const source = new HighScores(storage());
source.save(row("one", 1000), "ALPHA");
const targetStorage = storage(),
  target = new HighScores(targetStorage);
assert.equal(target.importBackup(source.exportBackup()).imported, 1);
assert.equal(target.importBackup(source.exportBackup()).imported, 0);
assert.equal(new HighScores(targetStorage).table(key)[0].name, "ALPHA");
const ties = new HighScores(storage());
ties.save(row("tie", 1000), "BETA");
target.importBackup(ties.exportBackup());
assert.equal(target.table(key)[0].id, "one");
for (let i = 0; i < 15; i++) source.save(row("extra-" + i, 2000 + i), "X");
target.importBackup(source.exportBackup());
assert.equal(target.table(key).length, 10);
const bad = JSON.parse(source.exportBackup());
bad.records.push({ ...bad.records[0], id: "bad", score: -1 });
const before = target.exportBackup();
assert.throws(() => target.importBackup(JSON.stringify(bad)), /Invalid/);
assert.deepEqual(
  JSON.parse(target.exportBackup()).records,
  JSON.parse(before).records,
);
assert.throws(() => target.importBackup("{oops"), /JSON/);
assert.throws(
  () =>
    target.importBackup(
      JSON.stringify({ format: "other", version: 1, records: [] }),
    ),
  /format/,
);
assert.throws(
  () => target.importBackup(" ".repeat(2 * 1024 * 1024 + 1)),
  /limit/,
);
const partition = new HighScores(storage());
partition.save(row("free", 800, scoreKey(chart, "free")), "<SAFE>");
target.importBackup(partition.exportBackup());
assert.equal(target.table(scoreKey(chart, "free"))[0].name, "SAFE");
const failed = new HighScores(null);
assert.equal(failed.importBackup(source.exportBackup()).ok, false);
assert.equal(failed.table(key).length, 10);
assert(failed.exportBackup().includes("extra-"));
console.log(
  "PASS record backup: round trip, reload, deduplication, ties, top ten, atomic validation, partitions, bounds, session fallback",
);
