import { DUST, MILKY, eqToHor, lst, moonAltAz, moonInfo, planetsAltAz, precessor, sunAltAz, type Loc } from "./sky";
import { LINES, STARS } from "./stars";
import { TINT, drawMoon, drawStar, glow, rgb, skyColors } from "./draw";

const D2R = Math.PI / 180;

export type SkyMode = "dark" | "city";
export type Placed = { id: string; name: string; kind: "star" | "planet" | "moon"; x: number; y: number; alt: number; az: number; mag: number; con?: string };

/** A stereographic camera looking at (az0, alt0). Returns screen coords or null when behind/outside. */
export function projector(w: number, h: number, az0Deg: number, alt0Deg: number, vfovDeg: number) {
  const az0 = az0Deg * D2R;
  const a0 = alt0Deg * D2R;
  const f = [Math.sin(az0) * Math.cos(a0), Math.cos(az0) * Math.cos(a0), Math.sin(a0)];
  const r = [Math.cos(az0), -Math.sin(az0), 0];
  const u = [-Math.sin(a0) * Math.sin(az0), -Math.sin(a0) * Math.cos(az0), Math.cos(a0)];
  const s = h / 2 / (2 * Math.tan((vfovDeg * D2R) / 4));
  return (alt: number, az: number, pad = 40) => {
    const A = alt * D2R;
    const Z = az * D2R;
    const v = [Math.cos(A) * Math.sin(Z), Math.cos(A) * Math.cos(Z), Math.sin(A)];
    const dz = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
    if (dz < -0.2) return null;
    const k = 2 / (1 + dz);
    const x = w / 2 + k * (v[0] * r[0] + v[1] * r[1]) * s;
    const y = h / 2 - k * (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) * s;
    if (x < -pad || x > w + pad || y < -pad || y > h + pad) return null;
    return { x, y };
  };
}

type Opts = { date: Date; loc: Loc; mode: SkyMode; az0?: number; alt0?: number; vfov?: number; lines?: boolean; paintBg?: boolean };

/**
 * Paint a photographic view of the real sky. Dark mode is a dark-site night with the Milky Way;
 * city mode is the same sky under orange skyglow, where only the brightest objects survive.
 */
export function drawPanorama(ctx: CanvasRenderingContext2D, w: number, h: number, o: Opts): Placed[] {
  const { date, loc, mode } = o;
  const az0 = o.az0 ?? (loc.lat >= 0 ? 180 : 0);
  const project = projector(w, h, az0, o.alt0 ?? 34, o.vfov ?? 74);
  const sun = sunAltAz(date, loc).alt;
  const city = mode === "city";

  if (o.paintBg !== false) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (city) {
      g.addColorStop(0, "#10141a");
      g.addColorStop(0.45, "#252530");
      g.addColorStop(0.78, "#5a4440");
      g.addColorStop(1, "#b07447");
    } else {
      const [top, mid, hor] = skyColors(Math.min(sun, -18), false);
      g.addColorStop(0, rgb(top));
      g.addColorStop(0.55, rgb(mid));
      g.addColorStop(0.86, rgb(hor));
      g.addColorStop(1, "#24443a");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const L = lst(date, loc.lon);
  const P = precessor(date);
  const hor = (ra: number, dec: number) => {
    const p = P(ra, dec);
    return eqToHor(p.ra, p.dec, loc.lat, L);
  };
  const limit = city ? 2.4 : 6.4;
  const scale = Math.max(0.8, Math.min(1.6, h / 800));

  // Milky Way, dark skies only: a soft glow plus clouds of tiny stars around each band point
  if (!city) {
    ctx.globalCompositeOperation = "lighter";
    const sprite = glow();
    const pts: { x: number; y: number; w: number; s: number; alt: number }[] = [];
    for (const m of MILKY) {
      const p = hor(m.ra, m.dec);
      if (p.alt < -2) continue;
      const q = project(p.alt, p.az, 80);
      if (!q) continue;
      const s = m.s * 2.2 * scale;
      pts.push({ ...q, w: m.w, s, alt: p.alt });
      ctx.globalAlpha = 0.085 * m.w * Math.min(1, (p.alt + 2) / 12);
      ctx.drawImage(sprite, q.x - s, q.y - s, s * 2, s * 2);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#f1ede2";
    pts.forEach((q, i) => {
      const n = Math.round(10 + 22 * q.w);
      for (let k = 0; k < n; k++) {
        const a = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
        const b = Math.sin(i * 39.3468 + k * 11.135) * 24634.6345;
        const fx = (a - Math.floor(a)) * 2 - 1;
        const fy = (b - Math.floor(b)) * 2 - 1;
        ctx.globalAlpha = (0.18 + 0.4 * Math.abs(fx * fy)) * Math.min(1, q.alt / 10 + 0.2);
        const sz = Math.abs(fx) > 0.92 ? 1.3 : 0.8;
        ctx.fillRect(q.x + fx * q.s * 0.9, q.y + fy * q.s * 0.9, sz, sz);
      }
    });
    ctx.globalAlpha = 1;
  }

  // Faint field
  ctx.fillStyle = "#efe8da";
  for (const d of DUST) {
    if (d.mag > limit) continue;
    const p = hor(d.ra, d.dec);
    if (p.alt < 1) continue;
    const q = project(p.alt, p.az);
    if (!q) continue;
    ctx.globalAlpha = Math.min(1, (limit - d.mag) / 1.4) * 0.7 * Math.min(1, p.alt / 8);
    const sz = d.mag < 4.4 ? 1.4 : 0.95;
    ctx.fillRect(q.x, q.y, sz, sz);
  }
  ctx.globalAlpha = 1;

  // Catalogue stars + stick figures
  const placed: Placed[] = [];
  const pos = new Map<string, { x: number; y: number; alt: number }>();
  for (const st of STARS) {
    const p = hor(st.ra, st.dec);
    if (p.alt < -2) continue;
    const q = project(p.alt, p.az);
    if (q) pos.set(st.id, { ...q, alt: p.alt });
    if (q && p.alt > 0 && st.mag <= limit) placed.push({ id: st.id, name: st.name, kind: "star", ...q, alt: p.alt, az: p.az, mag: st.mag, con: st.con });
  }
  if (o.lines !== false) {
    ctx.strokeStyle = city ? "rgba(255,226,190,.10)" : "rgba(214,198,160,.16)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const [a, b] of LINES) {
      const pa = pos.get(a);
      const pb = pos.get(b);
      if (!pa || !pb || pa.alt < 0 || pb.alt < 0) continue;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    }
    ctx.stroke();
  }
  for (const st of STARS) {
    const q = pos.get(st.id);
    if (!q || q.alt < 0 || st.mag > limit) continue;
    const a = Math.min(1, (limit - st.mag) / 1.1) * Math.min(1, q.alt / 4 + 0.25);
    drawStar(ctx, q.x, q.y, st.mag, TINT[st.tint ?? "white"], a, 1.15 * scale);
  }

  // Planets
  for (const pl of planetsAltAz(date, loc)) {
    if (pl.alt < 0) continue;
    const q = project(pl.alt, pl.az);
    if (!q) continue;
    drawStar(ctx, q.x, q.y, Math.min(pl.mag, -0.5), "#ffe9c2", 1, 1.25 * scale);
    placed.push({ id: pl.name.toLowerCase(), name: pl.name, kind: "planet", ...q, alt: pl.alt, az: pl.az, mag: pl.mag });
  }

  // Moon
  const mp = moonAltAz(date, loc);
  if (mp.alt > -1) {
    const q = project(mp.alt, mp.az);
    if (q) {
      drawMoon(ctx, q.x, q.y, 10 * scale, moonInfo(date).phase);
      placed.push({ id: "moon", name: "The Moon", kind: "moon", ...q, alt: mp.alt, az: mp.az, mag: -10 });
    }
  }

  // Skyglow wash over the horizon in the city
  if (city) {
    const sg = ctx.createLinearGradient(0, h * 0.45, 0, h);
    sg.addColorStop(0, "rgba(176,116,71,0)");
    sg.addColorStop(1, "rgba(196,128,76,.55)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, h * 0.45, w, h * 0.55);
  }
  return placed;
}
