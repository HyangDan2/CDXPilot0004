// Optional image QA: FFmpeg decodes alpha; no image assets are modified.
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { CHARACTERS } from "../js/characters.js";
const reports = [];
for (const character of CHARACTERS) {
  const url = new URL("../" + character.sheet, import.meta.url),
    png = await readFile(url);
  const width = png.readUInt32BE(16),
    height = png.readUInt32BE(20);
  assert.equal(png[25], 6);
  assert.equal(width, height);
  assert.equal(width % 3, 0);
  const decoded = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      fileURLToPath(url),
      "-vf",
      "alphaextract",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "gray",
      "-",
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
  assert.equal(decoded.status, 0, decoded.stderr.toString());
  assert.equal(decoded.stdout.length, width * height);
  const cellSize = width / 3,
    cells = [];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      let left = cellSize,
        top = cellSize,
        right = -1,
        bottom = -1;
      for (let y = 0; y < cellSize; y++)
        for (let x = 0; x < cellSize; x++) {
          // Ignore faint glow/noise below 13% alpha; substantial artwork must be inset.
          if (
            decoded.stdout[(row * cellSize + y) * width + col * cellSize + x] <=
            32
          )
            continue;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      assert(right >= 0, "Nonempty cell");
      const margins = [left, top, cellSize - 1 - right, cellSize - 1 - bottom];
      assert(
        Math.min(...margins) >= 2,
        character.id + " cell " + (row * 3 + col) + " touches cell boundary",
      );
      cells.push({ cell: row * 3 + col, marginsLeftTopRightBottom: margins });
    }
  reports.push({
    id: character.id,
    width,
    height,
    cellSize,
    alphaThreshold: 32,
    cells,
  });
  console.log(
    `PASS ${character.id}: all nine cells have a substantial-art boundary gutter`,
  );
}
await writeFile(
  new URL("../assets/characters/padding-verification.json", import.meta.url),
  JSON.stringify(
    {
      frameInsetPercent: 10,
      notes:
        "Alpha threshold excludes faint glow/noise. Runtime clipping and inset provide additional isolation. Not a live-browser layout test.",
      reports,
    },
    null,
    2,
  ) + "\n",
);
