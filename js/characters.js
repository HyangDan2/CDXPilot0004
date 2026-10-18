// Each local sheet uses the same row-major 3x3 expression contract.
export const CHARACTERS = Object.freeze([
  Object.freeze({
    id: "lumi",
    name: "LUMI",
    description: "A gentle cosmic DJ with cyan highlights.",
    sheet: "./assets/characters/lumi-expressions.png",
  }),
  Object.freeze({
    id: "nova",
    name: "NOVA",
    description: "A lively silver-haired DJ with magenta star accents.",
    sheet: "./assets/characters/nova-expressions.png",
  }),
]);
export function characterById(id) {
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}
export function characterSheet(id) {
  return new URL(characterById(id).sheet, new URL("../", import.meta.url)).href;
}
