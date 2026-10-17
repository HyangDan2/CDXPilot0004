const LIMITS = { low: 100, medium: 240, high: 480 };
export class Particles {
  constructor() {
    this.pool = Array.from({ length: 480 }, () => ({ life: 0 }));
    this.cursor = 0;
    this.stars = Array.from({ length: 260 }, (_, i) => ({
      radius: 0.12 + (((i * 73) % 257) / 257) * 0.78,
      angle: i * 2.39996,
      size: 0.5 + (i % 4) * 0.35,
      arm: i % 3,
    }));
    this.quality = "high";
    this.reduced =
      globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      false;
  }
  get limit() {
    return this.reduced ? 50 : LIMITS[this.quality];
  }
  clear() {
    for (const p of this.pool) p.life = 0;
  }
  burst(lane, lanes, result, time) {
    if (result === "MISS") return;
    const count = Math.round(
      ((result === "PERFECT" ? 32 : 14) * this.limit) / 480,
    );
    for (let i = 0; i < count; i++) {
      const p = this.pool[this.cursor++ % this.limit],
        angle = Math.random() * Math.PI * 2;
      Object.assign(p, {
        life: 1,
        at: time,
        x: (lane + 0.5) / lanes,
        y: 0.9,
        vx: Math.cos(angle) * (0.07 + Math.random() * 0.2),
        vy: Math.sin(angle) * (0.08 + Math.random() * 0.22) - 0.12,
        size: 1 + Math.random() * 3,
        lane,
      });
    }
  }
  drawHits(ctx, w, h, time, colors) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < this.limit; i++) {
      const p = this.pool[i];
      if (!p.life) continue;
      const age = time - p.at;
      if (age < 0 || age > 0.65) {
        p.life = 0;
        continue;
      }
      ctx.globalAlpha = (1 - age / 0.65) ** 2;
      ctx.fillStyle = colors[p.lane];
      const x = (p.x + p.vx * age) * w,
        y = (p.y + p.vy * age + age * age * 0.2) * h;
      ctx.fillRect(x, y, p.size, p.size * 2);
    }
    ctx.restore();
  }
  drawGalaxy(ctx, w, h, time, energy, combo) {
    const boost = Math.min(combo / 150, 1),
      pulse = energy.bass;
    const centerX = w * 0.64,
      centerY = h * 0.43,
      radius = Math.min(w, h) * (0.48 + pulse * 0.06);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const haze = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    );
    haze.addColorStop(
      0,
      `rgba(77,63,150,${0.06 + pulse * 0.12 + boost * 0.04})`,
    );
    haze.addColorStop(0.6, "rgba(45,80,120,.03)");
    haze.addColorStop(1, "transparent");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
    const count = this.reduced ? 45 : Math.min(this.stars.length, this.limit);
    for (let i = 0; i < count; i++) {
      const star = this.stars[i],
        rotation = this.reduced ? 0 : time * (0.025 + energy.mid * 0.025);
      const a = star.angle + rotation + star.radius * 5 + star.arm * 2.094;
      const x = centerX + Math.cos(a) * radius * star.radius,
        y = centerY + Math.sin(a) * radius * star.radius * 0.52;
      const blink = 0.45 + Math.sin(time * 2 + i) * energy.high * 0.5;
      ctx.fillStyle = i % 3 === 0 ? "#bb9dff" : "#7feafa";
      ctx.globalAlpha = Math.max(0.08, blink + boost * 0.15);
      ctx.beginPath();
      ctx.arc(x, y, star.size * (1 + energy.high * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.12 + pulse * 0.15;
    ctx.strokeStyle = "#8f95f7";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        radius * (0.55 + i * 0.17 + pulse * 0.04),
        radius * (0.2 + i * 0.08),
        -0.3,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}
