import type { Star } from "./stars";

/* ---------- sky colour by sun altitude ---------- */
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgb = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

// [sun altitude, top, middle, horizon]
const DUSK: [number, string, string, string][] = [
  [4, "#4f6577", "#a4908a", "#efbb8f"],
  [0, "#3a4b5b", "#8a7a80", "#e8a77f"],
  [-6, "#1e2c36", "#4b5157", "#c98665"],
  [-12, "#0e1a1f", "#1b2b2d", "#4e4640"],
  [-18, "#070d0d", "#0a1413", "#173029"],
  [-90, "#060b0b", "#091211", "#142a24"],
];
const DAWN: [number, string, string, string][] = [
  [4, "#6b7f8e", "#c7aaa6", "#f1d2c0"],
  [0, "#4d5f6e", "#a98f97", "#e8b2a6"],
  [-6, "#25333f", "#5d5a66", "#cf9590"],
  [-12, "#0f1b21", "#1d2a30", "#55474a"],
  [-18, "#070d0d", "#0a1413", "#173029"],
  [-90, "#060b0b", "#091211", "#142a24"],
];

export function skyColors(sunAlt: number, dawn: boolean): [RGB, RGB, RGB] {
  const table = dawn ? DAWN : DUSK;
  const a = Math.min(table[0][0], Math.max(-90, sunAlt));
  for (let i = 0; i < table.length - 1; i++) {
    const [a1, t1, m1, h1] = table[i];
    const [a2, t2, m2, h2] = table[i + 1];
    if (a <= a1 && a >= a2) {
      const t = (a1 - a) / (a1 - a2);
      return [mix(hex(t1), hex(t2), t), mix(hex(m1), hex(m2), t), mix(hex(h1), hex(h2), t)];
    }
  }
  const last = table[table.length - 1];
  return [hex(last[1]), hex(last[2]), hex(last[3])];
}

/** 0 in daylight → 1 in true dark. */
export const darkness = (sunAlt: number) => Math.min(1, Math.max(0, (-sunAlt - 1) / 16));

/* ---------- stars ---------- */
export const TINT: Record<NonNullable<Star["tint"]>, string> = {
  blue: "#d6e4ff",
  white: "#f7f4ec",
  yellow: "#fff0cc",
  orange: "#ffd5a6",
  red: "#ffb593",
};

export const starRadius = (mag: number, k = 1) => Math.max(0.55, (2.7 - 0.5 * mag) * k);

let glowSprite: HTMLCanvasElement | null = null;
/** Soft round sprite, drawn once and reused (no per-frame gradients). */
export function glow() {
  if (glowSprite) return glowSprite;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.25, "rgba(255,255,255,0.35)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  glowSprite = c;
  return c;
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, mag: number, tint: string, alpha: number, k = 1) {
  const r = starRadius(mag, k);
  if (mag < 1.6) {
    ctx.globalAlpha = alpha * Math.min(0.55, (1.8 - mag) * 0.22);
    const s = r * 7;
    ctx.drawImage(glow(), x - s / 2, y - s / 2, s, s);
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Moon disc with the correct lit fraction. phase: 0 new → 180 full → 360. */
export function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.5;
  const s = r * 6;
  ctx.drawImage(glow(), -s / 2, -s / 2, s, s);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(30,42,40,0.95)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  if (phase > 180) ctx.scale(-1, 1);
  const p = phase > 180 ? 360 - phase : phase;
  const c = Math.cos((p * Math.PI) / 180);
  ctx.fillStyle = "#f4ecdc";
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(0, 0, r * Math.abs(c), r, 0, Math.PI / 2, -Math.PI / 2, c > 0);
  ctx.fill();
  ctx.restore();
}

export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

const fontCache: Record<string, string> = {};
/** Canvas can't read CSS variables, so resolve next/font's generated family names once. */
export function fam(v: "--font-martian" | "--font-hanken" | "--font-bodoni") {
  if (!fontCache[v]) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    fontCache[v] = val || (v === "--font-martian" ? "monospace" : "sans-serif");
  }
  return fontCache[v];
}
