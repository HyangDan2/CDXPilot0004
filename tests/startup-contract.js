import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const html = read("index.html"), main = read("js/main.js");
assert(!main.includes('querySelector(".hold-help")'), "Removed help must never be accessed during start");
assert(!html.includes('class="hold-help"'), "Removed help stays absent");
assert(html.includes('js/main.js?v=6.2'), "Changed markup loads a fresh entry module");
for (const module of ["game", "beatmap", "music"])
  assert(main.includes(`./${module}.js?v=6.1`), "Changed revision-6 module is cache separated: " + module);
for (const id of ["menu", "play", "results", "countdown", "menu-mascot", "mascot", "result-mascot"])
  assert(html.includes(`id="${id}"`), "Visibility target exists: " + id);
assert(/<main[ >]/.test(html) && html.includes('<details class="record-panel">'), "Menu record panel exists");
console.log("PASS startup source contract: removed help, visibility targets and versioned entry/dependencies (static, not browser execution)");
