export const DEFAULTS = Object.freeze({
  volume: 70,
  musicVolume: 100,
  sfxVolume: 70,
  playMode: "standard",
  character: true,
  offset: 0,
  speed: 1,
  lanes: 4,
  difficulty: "normal",
  quality: "high",
  track: "neon-galaxy",
});
export function sanitizeSettings(data = {}) {
  const number = (key, low, high) =>
    Number.isFinite(Number(data[key])) && data[key] != null
      ? Math.max(low, Math.min(high, Number(data[key])))
      : DEFAULTS[key];
  return {
    volume: number("volume", 0, 100),
    musicVolume: number("musicVolume", 0, 100),
    sfxVolume: number("sfxVolume", 0, 100),
    playMode: data.playMode === "free" ? "free" : "standard",
    character: data.character !== false,
    offset: number("offset", -300, 300),
    speed: Math.round(number("speed", 0.5, 10) * 4) / 4,
    lanes: [4, 6].includes(Number(data.lanes)) ? Number(data.lanes) : 4,
    difficulty: ["easy", "normal", "hard", "expert"].includes(data.difficulty)
      ? data.difficulty
      : "normal",
    quality: ["low", "medium", "high"].includes(data.quality)
      ? data.quality
      : "high",
    track: typeof data.track === "string" ? data.track : DEFAULTS.track,
  };
}
export function loadSettings() {
  try {
    return sanitizeSettings(
      JSON.parse(localStorage.getItem("particle-beat-settings")) || {},
    );
  } catch {
    return { ...DEFAULTS };
  }
}
export function saveSettings(settings) {
  try {
    localStorage.setItem(
      "particle-beat-settings",
      JSON.stringify(sanitizeSettings(settings)),
    );
  } catch {
    /* Storage may be unavailable; session settings still work. */
  }
}
