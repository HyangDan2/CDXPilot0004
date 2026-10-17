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
    try {
      if (!this.storage) throw new Error("Storage unavailable");
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ records: this.records, lastName: this.lastName }),
      );
      this.error = "";
      return { ok: true, rank };
    } catch {
      this.error =
        "Storage unavailable. This record is saved for this session only.";
      return { ok: false, rank };
    }
  }
}
