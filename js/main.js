import { TouchInput, inputEnvironment } from "./touch.js";
import { HighScores, scoreKey } from "./highscores.js";
import { Countdown } from "./countdown.js";
import { SoundEffects } from "./sfx.js";
import { Mascot } from "./mascot.js";
import { loadBeatmap } from "./beatmap.js";
import { AudioEngine } from "./audio.js";
import { Game } from "./game.js";
import { Input } from "./input.js";
import { Renderer } from "./renderer.js";
import { MODES } from "./config.js";
import { loadSettings, saveSettings } from "./settings.js";
import { Calibration } from "./calibration.js";
import { sectionAt } from "./music.js";
const $ = (id) => document.getElementById(id),
  settings = loadSettings();
const audio = new AudioEngine(),
  renderer = new Renderer($("game-canvas"), $("cosmos"));
const countdown = new Countdown(),
  sfx = new SoundEffects(audio);
const mascot = new Mascot($("mascot")),
  resultMascot = new Mascot($("result-mascot"));
let scoreStorage;
try {
  scoreStorage = localStorage;
} catch {
  scoreStorage = null;
}
const highScores = new HighScores(scoreStorage);
let pendingRecord = null;
let countdownIsResume = false;
let tracks = [],
  chart,
  game,
  run,
  state = "menu",
  busy = false,
  loadSequence = 0,
  calibratedOffset = 0;
const formatTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const calibration = new Calibration(
  audio,
  $("calibration-message"),
  $("calibration-ring"),
  (offset) => {
    calibratedOffset = offset;
    $("calibration-apply").disabled = false;
  },
);
const input = new Input(
  (lane, slide = false) => {
    advanceCountdown();
    if (state === "playing" && !document.querySelector("dialog[open]")) {
      game.hit(lane, audio.time, { dragOnly: slide });
      if (game.failed) finish();
    }
  },
  () => {
    if ($("settings").open || $("tracks").open || $("calibration").open) return;
    if (state === "playing" || state === "countdown") {
      pause();
      return true;
    }
    if (state === "paused") {
      resume();
      return true;
    }
    return false;
  },
  (lane) => {
    if (state === "playing") game.release(lane, audio.time);
  },
);
let touchEnabled = false;
const touchInput = new TouchInput(
  $("lane-keys"),
  input,
  () =>
    touchEnabled &&
    ["playing", "countdown"].includes(state) &&
    !document.querySelector("dialog[open]"),
  () => game?.dragGroups.size > 0,
);
const coarsePointer = matchMedia("(any-pointer: coarse)");
function updateInputEnvironment() {
  const previous = touchEnabled;
  const environment = inputEnvironment(settings.inputMode, {
    touchPoints: navigator.maxTouchPoints || 0,
    coarse: coarsePointer.matches,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  touchEnabled = environment.touch;
  document.body.classList.toggle("touch-controls", touchEnabled);
  document.body.classList.toggle("compact-play", environment.compact);
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty(
    "--play-height",
    (viewport?.height || window.innerHeight) + "px",
  );
  if (previous !== touchEnabled) {
    pause();
    input.clear();
  }
  for (const [index, pad] of [...$("lane-keys").children].entries()) {
    pad.textContent = touchEnabled
      ? String(index + 1)
      : input.keys[index].slice(3);
    pad.setAttribute("aria-label", "Lane " + (index + 1));
  }
  $("input-description").textContent =
    settings.inputMode.toUpperCase() +
    " · " +
    (touchEnabled
      ? "Touch pads enabled. Keyboard also available."
      : "Keyboard controls. Select TOUCH to enable pads.");
}
let previousWidth = window.innerWidth;
window.addEventListener("resize", () => {
  if (touchEnabled && previousWidth !== window.innerWidth) pause();
  previousWidth = window.innerWidth;
  updateInputEnvironment();
});
window.visualViewport?.addEventListener("resize", updateInputEnvironment);
coarsePointer.addEventListener("change", updateInputEnvironment);
function screen(id) {
  document.body.classList.toggle("in-play", id === "play");
  updateInputEnvironment();
  if (id === "play" && document.body.classList.contains("compact-play"))
    window.scrollTo(0, 0);
  for (const name of ["menu", "play", "results"]) $(name).hidden = name !== id;
  document.querySelector("main > .record-panel").hidden = id !== "menu";
}
function clearFocus() {
  document.activeElement?.blur();
}
function currentTrack() {
  return tracks.find((t) => t.id === settings.track) || tracks[0];
}
function renderKeys(id, lanes) {
  const target = $(id);
  target.replaceChildren(
    ...MODES[lanes].keys.map((key, index) => {
      const kbd = document.createElement("kbd");
      kbd.textContent = key.slice(3);
      kbd.style.setProperty("--key-color", MODES[lanes].colors[index]);
      return kbd;
    }),
  );
  target.style.setProperty("--lanes", lanes);
  if (id === "lane-keys") updateInputEnvironment();
}
function applySettings() {
  updateInputEnvironment();
  audio.volume = settings.volume / 100;
  audio.musicVolume = settings.musicVolume / 100;
  audio.sfxVolume = settings.sfxVolume / 100;
  $("music-volume-value").value = settings.musicVolume + "%";
  $("sfx-volume-value").value = settings.sfxVolume + "%";
  document.body.classList.toggle("hide-character", !settings.character);
  renderer.speed = settings.speed;
  renderer.effects.quality = settings.quality;
  saveSettings(settings);
  if (state === "results" && game)
    resultMascot.draw(
      game.failed ? "failed" : "clear",
      game.health,
      audio.context.currentTime,
      settings.character,
    );
  $("speed-number").value = settings.speed;
  $("speed").value = settings.speed;
  $("speed-value").value = `${settings.speed.toFixed(2)}×`;
  $("volume-value").value = `${settings.volume}%`;
}
function renderTracks() {
  $("track-list").replaceChildren(
    ...tracks.map((track, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "track-option";
      button.style.setProperty("--track-color", track.color);
      button.setAttribute("aria-pressed", String(track.id === settings.track));
      button.innerHTML =
        '<span class="track-cover"></span><span><strong></strong><small></small></span><span class="track-time"></span>';
      button.querySelector(".track-cover").textContent = String(i + 1).padStart(
        2,
        "0",
      );
      button.querySelector("strong").textContent = track.title;
      button.querySelector("small").textContent = track.genre;
      button.querySelector(".track-time").textContent =
        `${track.bpm} BPM / ${formatTime(track.duration)}`;
      button.onclick = () => {
        settings.track = track.id;
        refreshSelection();
      };
      return button;
    }),
  );
}
async function refreshSelection() {
  const sequence = ++loadSequence,
    track = currentTrack();
  if (!track) return;
  settings.track = track.id;
  saveSettings(settings);
  $("start").disabled = true;
  chart = null;
  $("loaded-title").textContent = track.title;
  $("loaded-meta").textContent = `${track.genre} · ${track.bpm} BPM`;
  $("orbit-bpm").textContent = `${track.bpm} BPM`;
  $("track-duration").textContent = formatTime(track.duration);
  $("track-mode").textContent = `${settings.lanes} KEY`;
  $("track-badge").textContent = settings.difficulty.toUpperCase();
  renderKeys("menu-keys", settings.lanes);
  $("key-help-label").textContent = `${settings.lanes} LANES · TAP TO THE BEAT`;
  renderTracks();
  try {
    const loaded = await loadBeatmap(
      `./assets/beatmaps/library/${track.id}-${settings.lanes}-${settings.difficulty}.json`,
    );
    if (sequence !== loadSequence) return;
    audio.prefetch(loaded).catch(() => {});
    chart = loaded;
    const groups = new Map();
    for (const note of chart.notes)
      groups.set(note.time, (groups.get(note.time) || 0) + 1);
    $("loaded-meta").textContent +=
      " · " +
      chart.notes.length +
      " notes · max chord " +
      Math.max(...groups.values());
    $("track-badge").classList.toggle(
      "expert",
      settings.difficulty === "expert",
    );
    renderLeaderboard(chart, settings.playMode);
    $("start").disabled = false;
    $("status").textContent = "";
  } catch (error) {
    if (sequence === loadSequence) $("status").textContent = error.message;
  }
}
async function start() {
  if (pendingRecord) savePending("PLAYER");
  if (busy || !chart) return;
  const selectedChart = chart,
    selectedTrack = currentTrack();
  busy = true;
  $("mode").disabled = true;
  $("difficulty").disabled = true;
  state = "preparing";
  audio.stop();
  countdown.cancel();
  sfx.stop();
  calibration.stop();
  $("status").textContent = "Loading your frequency…";
  $("start").disabled = true;
  $("restart").disabled = true;
  $("retry").disabled = true;
  try {
    await audio.activate();
    await audio.prepare(selectedChart, (message) => {
      $("status").textContent = message;
    });
    applySettings();
    game = new Game(selectedChart, settings.offset, settings.playMode);
    run = {
      track: selectedTrack,
      lanes: selectedChart.lanes,
      difficulty: selectedChart.difficulty,
      playMode: settings.playMode,
      chart: selectedChart,
      id:
        globalThis.crypto?.randomUUID?.() ||
        Date.now().toString(36) + Math.random().toString(36),
    };
    input.setMode(selectedChart.lanes);
    document.querySelector(".drag-help").hidden =
      selectedChart.difficulty !== "expert";
    renderer.reset();
    mascot.reset();
    $("paused").close();
    screen("play");
    renderKeys("lane-keys", selectedChart.lanes);
    document
      .querySelector(".arena")
      .classList.toggle("six", selectedChart.lanes === 6);
    $("play-title").textContent = selectedChart.title;
    $("play-title").style.setProperty("--track-color", run.track.color);
    $("audio-mode").textContent = audio.fallback
      ? "LIVE SYNTHESIS · FALLBACK AUDIO"
      : "SAVED AUDIO · ORIGINAL INSTRUMENTAL";
    $("game-canvas").setAttribute(
      "aria-label",
      `${selectedChart.lanes} lanes. Use ${MODES[selectedChart.lanes].keys.map((k) => k.slice(3)).join(" ")}.`,
    );
    beginCountdown(false);
    clearFocus();
    $("status").textContent = "";
    if (document.hidden || !document.hasFocus()) pause();
  } catch (error) {
    audio.stop();
    countdown.cancel();
    sfx.stop();
    $("countdown").hidden = true;
    state = "menu";
    screen("menu");
    $("status").textContent = `Unable to start: ${error.message}`;
  } finally {
    busy = false;
    $("mode").disabled = false;
    $("difficulty").disabled = false;
    $("start").disabled = !chart;
    $("restart").disabled = false;
    $("retry").disabled = false;
  }
}
function beginCountdown(isResume) {
  countdownIsResume = isResume;
  input.clear();
  countdown.start(audio.context.currentTime, isResume ? 2 : 3);
  audio.play(countdown.deadline);
  sfx.countdown(countdown.startedAt, countdown.deadline);
  $("countdown-caption").textContent = isResume
    ? "RESUMING SIGNAL"
    : "GET READY";
  $("countdown-number").textContent = countdown.label(
    audio.context.currentTime,
  );
  $("countdown").hidden = false;
  $("countdown").classList.remove("go");
  if (isResume) {
    const anchor = [...game.dragGroups.values()]
      .flatMap((points) =>
        points.filter(
          (p, i) => p.anchorAt != null && points[i + 1] && !points[i + 1].done,
        ),
      )
      .at(-1);
    if (anchor)
      $("countdown-caption").textContent =
        "RE-HOLD " +
        (touchEnabled
          ? "LANE " + (anchor.lane + 1)
          : MODES[game.lanes].keys[anchor.lane].slice(3)) +
        " TO CONTINUE";
  }
  state = "countdown";
}
function advanceCountdown() {
  if (state === "countdown" && countdown.ready(audio.context.currentTime)) {
    state = "playing";
    $("countdown").classList.add("go");
    game.resumeInputs(input.held, audio.time);
  }
}
function pause() {
  if (!["playing", "countdown"].includes(state)) return;
  if (state === "countdown" && audio.context.currentTime < countdown.deadline) {
    // A cancelled lead-in restarts from the beginning; song position stays frozen.
    countdownIsResume = audio.position > 0;
  } else countdownIsResume = true;
  audio.pause();
  countdown.cancel();
  sfx.stop();
  $("countdown").hidden = true;
  state = "paused";
  game.suspendInputs();
  input.clear();
  $("paused").showModal();
}
async function resume() {
  if (state !== "paused" || busy) return;
  busy = true;
  try {
    await audio.activate();
    $("paused").close();
    beginCountdown(countdownIsResume);
    clearFocus();
    if (document.hidden || !document.hasFocus()) pause();
  } catch (error) {
    $("status").textContent = error.message;
  } finally {
    busy = false;
  }
}
function menu() {
  if (busy) return;
  if (pendingRecord) savePending("PLAYER");
  audio.stop();
  countdown.cancel();
  sfx.stop();
  $("countdown").hidden = true;
  input.clear();
  renderer.reset();
  state = "menu";
  $("paused").close();
  screen("menu");
  clearFocus();
}
function finish() {
  if (state !== "playing") return;
  audio.pause();
  countdown.cancel();
  $("countdown").hidden = true;
  const failed = game.failed;
  sfx.result(game.grade, failed);
  state = "results";
  input.clear();
  screen("results");
  $("grade").textContent = failed ? "×" : game.grade;
  $("result-eyebrow").textContent = failed
    ? "SIGNAL LOST / GAME OVER"
    : "TRANSMISSION COMPLETE";
  $("result-heading").innerHTML = failed
    ? "A little static.<br><span>Try again.</span>"
    : "Your frequency.<br><span>Found.</span>";
  resultMascot.reset();
  resultMascot.draw(
    failed ? "failed" : "clear",
    game.health,
    audio.context.currentTime,
    settings.character,
  );
  $("final-score").textContent = game.score.toLocaleString("en-US");
  $("final-accuracy").textContent = `${game.accuracy.toFixed(2)}%`;
  $("final-combo").textContent = game.maximumCombo;
  $("result-track").textContent =
    `${run.track.title} · ${run.lanes} KEYS · ${run.difficulty.toUpperCase()} · ${run.playMode === "free" ? "FREE PLAY" : "STANDARD"} · ${formatTime(audio.time)} / ${formatTime(audio.buffer.duration)}`;
  recordResult();
  $("counts").replaceChildren(
    ...Object.entries(game.counts).map(([name, count]) => {
      const span = document.createElement("span");
      span.textContent = `${name}  ${count}`;
      return span;
    }),
  );
}
function renderLeaderboard(selected, mode, target = "leaderboard") {
  const rows = highScores.table(scoreKey(selected, mode)),
    list = $(target);
  list.replaceChildren();
  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = "No completed runs yet.";
    list.append(li);
    return;
  }
  rows.forEach((row, index) => {
    const li = document.createElement("li");
    li.textContent =
      index +
      1 +
      ". " +
      row.name +
      " — " +
      row.score.toLocaleString("en-US") +
      " / " +
      row.accuracy.toFixed(2) +
      "% / " +
      row.combo +
      " combo / " +
      row.date.slice(0, 10);
    list.append(li);
  });
}
function recordResult() {
  const key = scoreKey(run.chart, run.playMode);
  const previous = highScores.table(key)[0];
  $("record-message").textContent =
    "Personal best: " +
    (previous ? previous.score.toLocaleString("en-US") : "—");
  if (!game.failed && highScores.qualifies(key, game.score)) {
    pendingRecord = {
      id: run.id,
      key,
      score: game.score,
      accuracy: game.accuracy,
      combo: game.maximumCombo,
      date: new Date().toISOString(),
    };
    if (highScores.isBest(key, game.score)) {
      $("record-message").textContent = "NEW LOCAL BEST!";
      $("record-name").value = highScores.lastName;
      $("record-dialog").showModal();
    } else savePending(highScores.lastName);
  }
  renderLeaderboard(run.chart, run.playMode, "result-leaderboard");
}
function savePending(name) {
  if (!pendingRecord) return;
  const result = highScores.save(pendingRecord, name);
  pendingRecord = null;
  $("record-dialog").close();
  $("record-message").textContent = result.ok
    ? "Record saved. Rank " + result.rank + "."
    : highScores.error;
  renderLeaderboard(run.chart, run.playMode, "result-leaderboard");
  if (chart) renderLeaderboard(chart, settings.playMode);
}
function openSettings() {
  if (busy) return;
  if (["playing", "countdown"].includes(state)) pause();
  $("calibrate-open").disabled = state === "paused";
  $("backup-status").textContent = highScores.error;
  $("settings").showModal();
}
let lastFrame = 0;
function frame(timestamp) {
  advanceCountdown();
  if (countdown.active) {
    const label = countdown.label(audio.context.currentTime);
    if ($("countdown-number").textContent !== label)
      $("countdown-number").textContent = label;
    if (
      state === "playing" &&
      audio.context.currentTime > countdown.deadline + 0.35
    ) {
      $("countdown").hidden = true;
      countdown.cancel();
    }
  }
  if (game && ["playing", "paused", "countdown"].includes(state)) {
    const time = audio.time;
    if (state === "playing") game.update(time);
    const events = game.drainEvents();
    renderer.feedback(events, game.lanes);
    mascot.reaction.react(events, audio.context.currentTime);
    mascot.draw(
      state,
      game.health,
      audio.context.currentTime,
      settings.character,
    );
    $("health-value").textContent = game.health;
    $("health-fill").style.width = game.health + "%";
    $("health-meter").setAttribute("aria-valuenow", game.health);
    $("health-meter").classList.toggle("low", game.health <= 25);
    $("run-mode").textContent =
      run.playMode === "free" ? "FREE PLAY / NO FAIL" : "STANDARD";
    renderer.draw(game, time, input.held);
    $("score").textContent = String(game.score).padStart(6, "0");
    $("accuracy").textContent = `${game.accuracy.toFixed(2)}%`;
    $("combo").textContent = game.combo;
    $("progress-fill").style.width =
      `${Math.min(100, (time / audio.buffer.duration) * 100)}%`;
    $("elapsed").textContent =
      `${formatTime(Math.min(time, audio.buffer.duration))} / ${formatTime(audio.buffer.duration)}`;
    $("play-selection").textContent =
      `${run.lanes} KEYS / ${run.difficulty.toUpperCase()} / ${settings.speed.toFixed(2)}× / ${sectionAt(time, run.track)}`;
    if (
      state === "playing" &&
      (game.failed || (game.complete && time >= audio.buffer.duration))
    )
      finish();
  }
  if (timestamp - lastFrame > (settings.quality === "low" ? 32 : 15)) {
    renderer.backgroundFrame(
      ["playing", "paused", "countdown"].includes(state)
        ? audio.time
        : timestamp / 1000,
      audio.energy(),
      state === "playing" ? game.combo : 0,
    );
    lastFrame = timestamp;
  }
  calibration.frame();
  requestAnimationFrame(frame);
}
$("start").onclick = start;
$("restart").onclick = start;
$("retry").onclick = start;
$("pause").onclick = pause;
$("resume").onclick = resume;
$("result-tracks").onclick = () => {
  if (busy) return;
  menu();
  $("tracks").showModal();
};
$("main-menu").onclick = menu;
$("pause-menu").onclick = menu;
$("pause-settings").onclick = openSettings;
$("paused").addEventListener("cancel", (event) => {
  event.preventDefault();
  resume();
});
$("settings-open").onclick = openSettings;
$("tracks-open").onclick = () => {
  if (!busy) $("tracks").showModal();
};
for (const field of [
  "volume",
  "musicVolume",
  "sfxVolume",
  "offset",
  "speed",
  "quality",
  "playMode",
  "inputMode",
]) {
  $(field).value = settings[field];
  $(field).addEventListener("input", () => {
    settings[field] = ["quality", "playMode", "inputMode"].includes(field)
      ? $(field).value
      : Number($(field).value);
    if (field === "speed")
      settings.speed =
        Math.round(Math.max(0.5, Math.min(10, settings.speed || 1)) * 4) / 4;
    if (field === "offset")
      settings.offset = Math.max(-300, Math.min(300, settings.offset || 0));
    applySettings();
  });
}
$("speed-number").onchange = () => {
  settings.speed =
    Math.round(
      Math.max(0.5, Math.min(10, Number($("speed-number").value) || 1)) * 4,
    ) / 4;
  applySettings();
};
$("playMode").addEventListener("change", () => {
  if (chart) renderLeaderboard(chart, settings.playMode);
});
$("records-export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([highScores.exportBackup()], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download =
    "particle-beat-records-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("backup-status").textContent =
    "Backup download requested. Keep the JSON file to restore your local records.";
};
$("records-import").onchange = async (event) => {
  const field = event.target,
    file = field.files[0];
  if (!file) return;
  field.disabled = true;
  try {
    if (file.size > 2 * 1024 * 1024)
      throw new Error("Backup exceeds the 2 MB limit.");
    const result = highScores.importBackup(await file.text());
    $("backup-status").textContent = result.ok
      ? result.imported + " records merged. Saved in this browser."
      : highScores.error;
    if (chart) renderLeaderboard(chart, settings.playMode);
    if (run) renderLeaderboard(run.chart, run.playMode, "result-leaderboard");
  } catch (error) {
    $("backup-status").textContent = error.message;
  } finally {
    field.value = "";
    field.disabled = false;
  }
};
$("record-save").onclick = () => savePending($("record-name").value);
$("record-skip").onclick = () => savePending("PLAYER");
$("record-dialog").addEventListener("cancel", (event) => {
  event.preventDefault();
  savePending("PLAYER");
});
$("record-form").onsubmit = (event) => {
  event.preventDefault();
  savePending($("record-name").value);
};
$("character").checked = settings.character;
$("character").onchange = () => {
  settings.character = $("character").checked;
  applySettings();
};
$("mode").value = settings.lanes;
$("difficulty").value = settings.difficulty;
$("mode").onchange = () => {
  settings.lanes = Number($("mode").value);
  refreshSelection();
};
$("difficulty").onchange = () => {
  settings.difficulty = $("difficulty").value;
  refreshSelection();
};
$("calibrate-open").onclick = () => {
  sfx.stop();
  $("settings").close();
  $("calibration").showModal();
};
$("calibration-start").onclick = async () => {
  $("calibration-apply").disabled = true;
  try {
    await calibration.start();
  } catch (error) {
    $("calibration-message").textContent = error.message;
  }
};
$("calibration-close").onclick = () => {
  calibration.stop();
  $("calibration").close();
};
$("calibration").addEventListener("cancel", () => calibration.stop());
$("calibration-apply").onclick = () => {
  settings.offset = calibratedOffset;
  $("offset").value = settings.offset;
  applySettings();
  calibration.stop();
  $("calibration").close();
};
window.addEventListener("keydown", (event) => {
  if ($("calibration").open && event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) calibration.tap();
  }
});
window.addEventListener("blur", () => {
  input.clear();
  pause();
  calibration.stop();
  sfx.stop();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    input.clear();
    pause();
    calibration.stop();
  }
});
applySettings();
try {
  const response = await fetch("./assets/tracks.json");
  if (!response.ok) throw new Error("Unable to load the track library.");
  tracks = await response.json();
  await refreshSelection();
} catch (error) {
  $("status").textContent = error.message;
}
requestAnimationFrame(frame);
