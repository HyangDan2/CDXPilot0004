import { characterById, characterSheet } from "./characters.js";
const CELLS = {
  idle: 0,
  perfect: 1,
  good: 2,
  miss: 3,
  worried: 4,
  failed: 5,
  clear: 6,
  ready: 7,
  blink: 8,
};
const PRIORITY = { GOOD: 1, PERFECT: 2, MISS: 3 };
export class MascotReaction {
  constructor() {
    this.reset();
  }
  reset() {
    this.reaction = null;
    this.until = 0;
  }
  react(events, now) {
    const best = events.reduce(
      (chosen, event) =>
        !chosen || PRIORITY[event.result] > PRIORITY[chosen.result]
          ? event
          : chosen,
      null,
    );
    if (!best) return;
    if (
      now < this.until &&
      this.reaction &&
      PRIORITY[best.result] < PRIORITY[this.reaction]
    )
      return;
    this.reaction = best.result;
    this.until = now + 0.4;
  }
  expression(state, health, now) {
    if (state === "failed") return "failed";
    if (state === "clear") return "clear";
    if (state === "countdown" || state === "paused") return "ready";
    if (now < this.until && this.reaction) return this.reaction.toLowerCase();
    if (health <= 25) return "worried";
    return now % 5.5 > 5.35 ? "blink" : "idle";
  }
}
export class Mascot {
  constructor(element) {
    this.element = element;
    this.characterId = null;
    this.setCharacter("lumi");
    this.reaction = new MascotReaction();
    this.current = null;
  }
  setCharacter(id) {
    const character = characterById(id);
    if (this.characterId === character.id) return;
    this.characterId = character.id;
    this.element.style.backgroundImage =
      'url("' + characterSheet(character.id) + '")';
    this.element.dataset.character = character.id;
    this.current = null;
  }
  reset() {
    this.reaction.reset();
    this.current = null;
  }
  draw(state, health, now, enabled = true) {
    this.element.hidden = !enabled;
    if (!enabled) return;
    const expression = this.reaction.expression(state, health, now);
    if (expression === this.current) return;
    this.current = expression;
    const cell = CELLS[expression];
    this.element.style.backgroundPosition = `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%`;
    this.element.dataset.expression = expression;
    this.element.setAttribute(
      "aria-label",
      `${characterById(this.characterId).name}, your space DJ: ${expression}`,
    );
  }
}
