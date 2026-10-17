const STORAGE_KEY = "particle-beat-records-v1";
export function cleanName(value) {
  return (
    Array.from(
      String(value ?? "")
        .replace(/[\u0000-\u001f\u007f<>]/g, "")
        .trim(),
    )
      .slice(0, 12)
      .join("") || "PLAYER"
  );
}
export function scoreKey(chart, mode) {
  let hash = 2166136261;
  for (const ch of JSON.stringify([chart.offsetMs, chart.notes]))
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return JSON.stringify([
    chart.trackId || chart.id,
    chart.lanes,
    chart.difficulty,
    mode,
    chart.version || "legacy",
    hash.toString(16),
  ]);
}
export class HighScores {
  constructor(storage) {
    this.storage = storage;
    this.records = [];
    this.lastName = "PLAYER";
    this.error = "";
    try {
      const data = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
      if (data) {
        if (!Array.isArray(data.records)) throw new Error("Invalid records");
        this.lastName = cleanName(data.lastName);
        const ids = new Set();
        this.records = data.records
          .filter(
            (r) =>
              r &&
              typeof r.id === "string" &&
              !ids.has(r.id) &&
              typeof r.key === "string" &&
              r.key.length < 500 &&
              typeof r.name === "string" &&
              Number.isInteger(r.score) &&
              r.score >= 0 &&
              Number.isFinite(r.accuracy) &&
              r.accuracy >= 0 &&
              r.accuracy <= 100 &&
              Number.isInteger(r.combo) &&
              r.combo >= 0 &&
              typeof r.date === "string" &&
              Number.isFinite(Date.parse(r.date)) &&
              (ids.add(r.id), true),
          )
          .map((r) => ({ ...r, name: cleanName(r.name) }))
          .slice(0, 2000);
      }
    } catch {
      this.error =
        "Saved records could not be read. New records will be kept for this session.";
    }
  }
  exportBackup() {
    return JSON.stringify(
      {
        format: "particle-beat-records",
        version: 1,
        exportedAt: new Date().toISOString(),
        records: this.records,
      },
      null,
      2,
    );
  }
  importBackup(text) {
    if (typeof text !== "string" || text.length > 2 * 1024 * 1024)
      throw new Error("Backup exceeds the 2 MB limit.");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Backup is not valid JSON.");
    }
    if (
      !data ||
      data.format !== "particle-beat-records" ||
      data.version !== 1 ||
      !Array.isArray(data.records) ||
      data.records.length > 2000
    )
      throw new Error("Unsupported backup format or too many records.");
    const incoming = data.records.map((r) => {
      let key;
      try {
        key = JSON.parse(r?.key);
      } catch {
        throw new Error("Invalid record board.");
      }
      if (
        !Array.isArray(key) ||
        key.length !== 6 ||
        typeof key[0] !== "string" ||
        !key[0] ||
        key[0].length > 100 ||
        ![4, 6].includes(key[1]) ||
        !["easy", "normal", "hard", "expert"].includes(key[2]) ||
        !["standard", "free"].includes(key[3]) ||
        typeof key[4] !== "string" ||
        !key[4] ||
        key[4].length > 40 ||
        typeof key[5] !== "string" ||
        !/^[0-9a-f]{1,8}$/.test(key[5])
      )
        throw new Error("Invalid record board.");
      if (
        typeof r.id !== "string" ||
        !r.id ||
        r.id.length > 200 ||
        typeof r.name !== "string" ||
        r.name.length > 200 ||
        !Number.isSafeInteger(r.score) ||
        r.score < 0 ||
        !Number.isFinite(r.accuracy) ||
        r.accuracy < 0 ||
        r.accuracy > 100 ||
        !Number.isSafeInteger(r.combo) ||
        r.combo < 0 ||
        typeof r.date !== "string" ||
        r.date.length > 40 ||
        !Number.isFinite(Date.parse(r.date))
      )
        throw new Error("Invalid record values. No records were imported.");
      return {
        id: r.id,
        key: JSON.stringify(key),
        name: cleanName(r.name),
        score: r.score,
        accuracy: r.accuracy,
        combo: r.combo,
        date: new Date(r.date).toISOString(),
      };
    });
    const ids = new Set(this.records.map((r) => r.id)),
      added = [];
    for (const row of incoming)
      if (!ids.has(row.id)) {
        ids.add(row.id);
        added.push(row);
      }
    const counts = new Map();
    const merged = [...this.records, ...added]
      .sort((a, b) => b.score - a.score)
      .filter((r) => {
        const count = counts.get(r.key) || 0;
        counts.set(r.key, count + 1);
        return count < 10;
      });
    if (merged.length > 2000)
      throw new Error("Merged backup exceeds the 2,000 record limit.");
    const addedIds = new Set(added.map((r) => r.id));
    const imported = merged.filter((r) => addedIds.has(r.id)).length;
    this.records = merged;
    return { ok: this.persist(), imported };
  }
  persist() {
    try {
      if (!this.storage) throw new Error("Storage unavailable");
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ records: this.records, lastName: this.lastName }),
      );
      this.error = "";
      return true;
    } catch {
      this.error =
        "Storage unavailable. Records are kept for this session only. Export a backup before closing.";
      return false;
    }
  }
  table(key) {
    return this.records
      .filter((r) => r.key === key)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  qualifies(key, score) {
    const table = this.table(key);
    return table.length < 10 || score > table.at(-1).score;
  }
  isBest(key, score) {
    const table = this.table(key);
    return !table.length || score > table[0].score;
  }
  save(record, name) {
    if (!this.records.some((r) => r.id === record.id)) {
      if (
        !Number.isInteger(record.score) ||
        record.score < 0 ||
        !Number.isFinite(record.accuracy) ||
        record.accuracy < 0 ||
        record.accuracy > 100 ||
        !Number.isInteger(record.combo) ||
        record.combo < 0
      )
        throw new Error("Invalid score");
      if (!this.qualifies(record.key, record.score))
        return { ok: true, rank: null };
      const row = { ...record, name: cleanName(name) };
      this.records.push(row);
      if (row.name !== "PLAYER") this.lastName = row.name;
      const keep = new Set(this.table(record.key).map((r) => r.id));
      this.records = this.records.filter(
        (r) => r.key !== record.key || keep.has(r.id),
      );
    }
    const rank =
      this.table(record.key).findIndex((r) => r.id === record.id) + 1;
    return { ok: this.persist(), rank };
  }
}
