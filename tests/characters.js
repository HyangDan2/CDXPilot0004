import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHARACTERS, characterById } from "../js/characters.js";
import { Mascot, mountCharacterSprite } from "../js/mascot.js";
import {
  sanitizeSettings,
  saveSettings,
  loadSettings,
} from "../js/settings.js";
assert.equal(characterById("unknown").id, "lumi");
assert.equal(sanitizeSettings({}).characterId, "lumi");
assert.equal(sanitizeSettings({ characterId: "unknown" }).characterId, "lumi");
const previous = globalThis.localStorage;
let stored;
globalThis.localStorage = {
  setItem: (key, value) => (stored = value),
  getItem: () => stored,
};
saveSettings({ ...sanitizeSettings(), characterId: "nova", character: false });
assert.equal(loadSettings().characterId, "nova");
assert.equal(loadSettings().character, false);
globalThis.localStorage = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
};
saveSettings({ characterId: "nova" });
assert.equal(loadSettings().characterId, "lumi");
globalThis.localStorage = previous;
const makeElement = () => ({
  style: {},
  ownerDocument: { createElement: () => makeElement() },
  replaceChildren(child) {
    this.children = [child];
  },
  dataset: {},
  hidden: false,
  setAttribute(name, value) {
    this[name] = value;
  },
});
const views = Array.from({ length: 3 }, () => new Mascot(makeElement()));
for (const character of CHARACTERS) {
  const png = readFileSync(new URL("../" + character.sheet, import.meta.url));
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png[25], 6, "RGBA asset");
  assert.equal(png.readUInt32BE(16), png.readUInt32BE(20));
  assert.equal(png.readUInt32BE(16) % 3, 0);
  for (const view of views) {
    view.setCharacter(character.id);
    assert.equal(view.element.children.length, 1);
    assert.equal(view.sprite.className, "mascot-sprite");
    assert.equal(
      view.element.style.backgroundImage,
      undefined,
      "Outer frame must not render the sheet",
    );
    view.reset();
    const cases = [
      ["menu", 100, 0, "idle", 0],
      ["menu", 100, 5.4, "blink", 8],
      ["paused", 100, 0, "ready", 7],
      ["playing", 20, 0, "worried", 4],
      ["failed", 0, 0, "failed", 5],
      ["clear", 100, 0, "clear", 6],
    ];
    for (const [state, health, time, expression, cell] of cases) {
      view.draw(state, health, time);
      assert.equal(view.element.dataset.expression, expression);
      assert.equal(
        view.sprite.style.backgroundPosition,
        `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%`,
      );
    }
    for (const [result, cell] of [
      ["PERFECT", 1],
      ["GOOD", 2],
      ["MISS", 3],
    ]) {
      view.reset();
      view.reaction.react([{ result }], 1);
      view.draw("playing", 100, 1);
      assert.equal(view.element.dataset.expression, result.toLowerCase());
      assert.equal(
        view.sprite.style.backgroundPosition,
        `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%`,
      );
    }
    assert(
      view.sprite.style.backgroundImage.includes(
        character.id + "-expressions-padded.png",
      ),
    );
    assert(view.element["aria-label"].includes(character.name));
    view.draw("menu", 100, 0, false);
    assert(view.element.hidden);
    view.draw("menu", 100, 0, true);
    assert(!view.element.hidden);
  }
}
views[0].setCharacter("lumi");
views[0].draw("menu", 100, 0);
assert(
  views[0].element["aria-label"].includes("LUMI"),
  "Same expression refreshes after skin change",
);
console.log(
  "PASS characters: two RGBA grid sheets, nine expressions on three views, selection persistence, legacy migration, invalid fallback, visibility and storage failure",
);

const preview = makeElement();
mountCharacterSprite(preview, "nova");
assert.equal(preview.children.length, 1);
assert(
  preview.children[0].style.backgroundImage.includes(
    "nova-expressions-padded.png",
  ),
);
