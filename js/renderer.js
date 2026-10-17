import { MODES, noteY } from "./config.js";
import { Particles } from "./particles.js";
export class Renderer {
  constructor(canvas, background = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.background = background;
    this.bg = background?.getContext("2d");
    this.effects = new Particles();
    this.speed = 1;
    this.lastHits = [];
  }
  resize(canvas, ctx, maxDpr = 2) {
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      dpr = Math.min(globalThis.devicePixelRatio || 1, maxDpr);
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }
  backgroundFrame(time, energy, combo) {
    if (!this.bg) return;
    const { w, h } = this.resize(
      this.background,
      this.bg,
      this.effects.quality === "high" ? 1.5 : 1,
    );
    this.bg.clearRect(0, 0, w, h);
    this.effects.drawGalaxy(this.bg, w, h, time, energy, combo);
  }
  reset() {
    this.effects.clear();
    this.lastHits = [];
  }
  feedback(events, lanes) {
    for (const event of events) {
      this.effects.burst(event.lane, lanes, event.result, event.at);
      this.lastHits[event.lane] = event;
    }
  }
  draw(game, time, held) {
    const { ctx } = this,
      { w, h } = this.resize(
        this.canvas,
        ctx,
        this.effects.quality === "low" ? 1 : 2,
      );
    ctx.clearRect(0, 0, w, h);
    const lanes = game.lanes,
      colors = MODES[lanes].colors,
      laneWidth = w / lanes,
      line = h - 48;
    for (let lane = 0; lane < lanes; lane++) {
      const x = lane * laneWidth,
        hit = this.lastHits[lane],
        age = hit ? time - hit.at : 10;
      const glow = ctx.createLinearGradient(0, 0, 0, h);
      glow.addColorStop(0, "#101426db");
      glow.addColorStop(
        1,
        held.has(lane) ? colors[lane] + "66" : colors[lane] + "18",
      );
      ctx.fillStyle = glow;
      ctx.fillRect(x, 0, laneWidth, h);
      ctx.strokeStyle = "#ffffff12";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      if (age >= 0 && age < 0.35) {
        ctx.globalAlpha = 1 - age / 0.35;
        const beam = ctx.createLinearGradient(0, line - 180, 0, line);
        beam.addColorStop(0, "transparent");
        beam.addColorStop(
          1,
          hit.result === "MISS" ? "#ff456433" : colors[lane] + "88",
        );
        ctx.fillStyle = beam;
        ctx.fillRect(x, line - 180, laneWidth, 180);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = colors[lane];
      ctx.shadowColor = colors[lane];
      ctx.shadowBlur = this.effects.quality === "low" ? 0 : 12;
      ctx.fillRect(x + 7, line, laneWidth - 14, 3);
      ctx.shadowBlur = 0;
    }
    // Ribbons connect timed checkpoints; resolved anchors clamp to the judgement line.
    for (const points of game.dragGroups.values()) {
      if (points.every((point) => point.done)) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      ctx.strokeStyle = "#a4fff0";
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      points.forEach((point, i) => {
        const x = (point.lane + 0.5) * laneWidth,
          y = point.done ? line : noteY(point.at, time, line, this.speed);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }
    for (const note of game.notes) {
      if (note.done) continue;
      const y = noteY(note.at, time, line, this.speed);
      if (y < -16) break;
      if (y > h) continue;
      const x = note.lane * laneWidth + 7;
      ctx.shadowColor = colors[note.lane];
      ctx.shadowBlur = this.effects.quality === "low" ? 0 : 14;
      ctx.fillStyle = colors[note.lane];
      ctx.fillRect(x, y - 6, laneWidth - 14, 12);
      ctx.shadowBlur = 0;
      if (note.type === "drag") {
        ctx.fillStyle = "#091521";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          note.step === 0
            ? "HOLD"
            : note.step === game.dragGroups.get(note.group).length - 1
              ? "END"
              : note.lane < game.dragGroups.get(note.group)[note.step - 1].lane
                ? "←"
                : "→",
          x + (laneWidth - 14) / 2,
          y + 4,
        );
      }
      ctx.fillStyle = "#ffffffbb";
      ctx.fillRect(x, y - 6, laneWidth - 14, 2);
    }
    this.effects.drawHits(ctx, w, h, time, colors);
    const feedback = game.feedback;
    if (feedback && time - feedback.at < 0.5) {
      ctx.globalAlpha = Math.max(0, 1 - (time - feedback.at) / 0.5);
      ctx.fillStyle =
        feedback.result === "MISS"
          ? "#ff799b"
          : feedback.result === "PERFECT"
            ? "#8affef"
            : "#c2b0ff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(feedback.result, w / 2, line - 75);
      ctx.font = "10px Arial";
      if (feedback.errorMs != null)
        ctx.fillText(
          `${feedback.errorMs >= 0 ? "+" : ""}${feedback.errorMs.toFixed(0)} ms`,
          w / 2,
          line - 56,
        );
      ctx.globalAlpha = 1;
    }
  }
}
