import { TRACKS } from "../js/music.js";
import { AudioEngine } from "../js/audio.js";
import { Game } from "../js/game.js";
import { loadBeatmap } from "../js/beatmap.js";
import { Renderer } from "../js/renderer.js";
import { Input } from "../js/input.js";
import { MODES, noteY } from "../js/config.js";
const $ = (id) => document.getElementById(id),
  audio = new AudioEngine(),
  renderer = new Renderer($("audit-canvas"));
const errors = [];
window.addEventListener("error", (event) => errors.push(event.message));
window.addEventListener("unhandledrejection", (event) =>
  errors.push(String(event.reason)),
);
let game,
  chart,
  active = false,
  paused = false,
  loading = false,
  index = 0,
  startClock = 0,
  startPerformance = 0,
  pausedAt = 0,
  pausePerformance = 0,
  pauseTotal = 0,
  autoPaused = false,
  autoResumed = false,
  resumeDeadline = 0,
  endedAt = null,
  previousFrame = 0,
  frameGaps = [],
  hitErrors = [],
  snapshots = [],
  pauseCheck = null;
for (const t of TRACKS) {
  const option = document.createElement("option");
  option.value = t.id;
  option.textContent = t.title;
  $("track").append(option);
}
const input = new Input(
  (lane) => {
    if (active && !paused) game.hit(lane, audio.time);
  },
  () => false,
  (lane) => {
    if (active && !paused) game.release(lane, audio.time);
  },
);
function controls() {
  for (const id of ["track", "lanes", "difficulty", "run"])
    $(id).disabled = active || loading;
  $("pause").disabled = !active || paused;
  $("resume").disabled = !active || !paused;
  $("stop").disabled = !active;
}
function snapshot(label) {
  const data = audio.diagnostics();
  snapshots.push({
    label,
    songTime: Number(data.songTime.toFixed(6)),
    contextState: data.contextState,
    clockErrorMs: Number(
      ((data.songTime - (data.contextTime - startClock)) * 1000).toFixed(6),
    ),
    elapsedVsAudioMs: Number(
      (
        (performance.now() - startPerformance - pauseTotal) / 1000 -
        data.songTime
      ).toFixed(2),
    ),
    baseLatencyMs: data.baseLatencyMs,
    outputLatencyMs: data.outputLatencyMs,
  });
}
function pause(manual = true) {
  if (!active || paused) return;
  pausedAt = audio.time;
  audio.pause();
  paused = true;
  game.suspendInputs();
  pausePerformance = performance.now();
  input.clear();
  controls();
  $("audit-status").textContent = manual
    ? "Paused. Click Resume to continue."
    : "Automatic 500ms pause test…";
}
async function resume() {
  if (!paused) return;
  await audio.activate();
  pauseCheck = Math.abs(audio.time - pausedAt) < 1e-9;
  pauseTotal += performance.now() - pausePerformance;
  const anchor = [...game.dragGroups.values()]
    .flatMap((points) =>
      points.filter(
        (point, i) =>
          point.anchorAt != null && points[i + 1] && !points[i + 1].done,
      ),
    )
    .at(-1);
  if (anchor)
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: MODES[chart.lanes].keys[anchor.lane],
        bubbles: true,
      }),
    );
  game.resumeInputs(input.held, audio.time);
  audio.play();
  audio.source.onended = () => {
    if (audio.time >= audio.buffer.duration - 0.05) endedAt = audio.time;
  };
  startClock = audio.startedAt - audio.position;
  paused = false;
  previousFrame = 0;
  controls();
  snapshot("resume");
}
function report(final = false) {
  const sorted = [...frameGaps].sort((a, b) => a - b),
    hits = [...hitErrors].sort((a, b) => a - b);
  $("report").textContent = JSON.stringify(
    {
      status: final ? "COMPLETE" : paused ? "PAUSED" : "RUNNING",
      track: chart.title,
      lanes: chart.lanes,
      difficulty: chart.difficulty,
      audioMode: audio.fallback ? "fallback" : "OfflineAudioContext",
      duration: audio.buffer.duration,
      songTime: Number(audio.time.toFixed(3)),
      score: game.score,
      accuracy: game.accuracy,
      judgements: game.counts,
      notes: chart.notes.length,
      pausedClockFrozen: pauseCheck,
      endedAt,
      frameP95Ms: sorted[Math.floor(sorted.length * 0.95)] || 0,
      maximumFrameGapMs: Math.max(0, ...frameGaps),
      inputP95ErrorMs: hits[Math.floor(hits.length * 0.95)] || 0,
      snapshots,
      errors,
      checks: final
        ? {
            allNotesResolved: game.complete,
            countsMatch:
              Object.values(game.counts).reduce((a, b) => a + b, 0) ===
              chart.notes.length,
            sourceEnded: endedAt !== null,
            clockContinuity: snapshots.every(
              (s) => Math.abs(s.clockErrorMs) < 0.01,
            ),
            zeroMisses: game.counts.MISS === 0,
            pausedClockFrozen: pauseCheck === true,
            consoleErrors: errors.length === 0,
          }
        : undefined,
    },
    null,
    2,
  );
}
$("run").onclick = async () => {
  if (active || loading) return;
  loading = true;
  controls();
  $("audit-status").textContent = "Preparing real audio buffer…";
  try {
    await audio.activate();
    const id = $("track").value,
      lanes = Number($("lanes").value),
      difficulty = $("difficulty").value;
    const data = await loadBeatmap(
      `../assets/beatmaps/library/${id}-${lanes}-${difficulty}.json`,
    );
    chart = data;
    await audio.prepare(chart, (message) => {
      $("audit-status").textContent = message;
    });
    audio.volume = 0.5;
    game = new Game(chart, 0, "free");
    input.setMode(lanes);
    renderer.reset();
    index = 0;
    autoPaused = false;
    autoResumed = false;
    paused = false;
    pauseTotal = 0;
    pauseCheck = null;
    endedAt = null;
    previousFrame = 0;
    frameGaps = [];
    hitErrors = [];
    snapshots = [];
    errors.length = 0;
    audio.play();
    audio.source.onended = () => {
      if (audio.time >= audio.buffer.duration - 0.05) endedAt = audio.time;
    };
    startClock = audio.startedAt;
    startPerformance = performance.now();
    active = true;
    snapshot("start");
    $("audit-status").textContent =
      "Running a full two-minute browser playback audit.";
    document.activeElement?.blur();
  } catch (error) {
    errors.push(error.message);
    $("audit-status").textContent = `Failed: ${error.message}`;
  } finally {
    loading = false;
    controls();
  }
};
$("pause").onclick = () => pause();
$("resume").onclick = resume;
$("stop").onclick = () => {
  audio.stop();
  active = false;
  paused = false;
  controls();
  $("audit-status").textContent = "Stopped. This run is incomplete.";
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause();
    autoResumed = true;
  }
});
function frame(now) {
  if (active) {
    if (paused) {
      if (
        autoPaused &&
        !autoResumed &&
        now >= resumeDeadline &&
        !document.hidden
      ) {
        autoResumed = true;
        resume();
      }
    } else {
      if (previousFrame) frameGaps.push(now - previousFrame);
      previousFrame = now;
      const time = audio.time;
      while (index < game.notes.length && game.notes[index].at <= time) {
        const note = game.notes[index++],
          code = MODES[chart.lanes].keys[note.lane];
        hitErrors.push((time - note.at) * 1000);
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", { code, bubbles: true }),
        );
        if (note.type === "drag") {
          const points = game.dragGroups.get(note.group),
            previous = points[note.step - 1];
          if (previous)
            document.body.dispatchEvent(
              new KeyboardEvent("keyup", {
                code: MODES[chart.lanes].keys[previous.lane],
                bubbles: true,
              }),
            );
          if (note.step === points.length - 1)
            document.body.dispatchEvent(
              new KeyboardEvent("keyup", { code, bubbles: true }),
            );
        } else
          document.body.dispatchEvent(
            new KeyboardEvent("keyup", { code, bubbles: true }),
          );
      }
      game.update(time);
      renderer.feedback(game.drainEvents(), chart.lanes);
      renderer.speed = time < 40 ? 0.5 : time < 80 ? 2 : 10;
      renderer.draw(game, time, input.held);
      if (!autoPaused && time >= 10) {
        snapshot("before pause");
        autoPaused = true;
        pause(false);
        resumeDeadline = now + 500;
      }
      for (const at of [30, 60, 90, 119])
        if (time >= at && !snapshots.some((s) => s.label === `${at}s`))
          snapshot(`${at}s`);
      if (time >= audio.buffer.duration + 0.05 && game.complete) {
        snapshot("finish");
        report(true);
        audio.pause();
        active = false;
        controls();
        $("audit-status").textContent =
          "Audit complete. Inspect the checks and timing measurements below.";
      } else if (
        Math.floor(now / 250) !==
        Math.floor((now - (frameGaps.at(-1) || 16)) / 250)
      )
        report();
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
