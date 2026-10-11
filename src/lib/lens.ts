import { MILKY, eqToHor, lst, moonAltAz, moonInfo, planetsAltAz, precessor, sunAltAz, type Loc } from "./sky";
import { TINTS, type Catalog } from "./catalog";
import { drawMoon, drawStar, glow, rgb, skyColors } from "./draw";
import { projector } from "./panorama";

/*
 * The app's sky lens. computeSky() places everything once for a moment in time;
 * drawLens() projects it for a view direction every frame (cheap, so it can follow the compass).
 */

export type ObjKind = "star" | "planet" | "moon" | "sun" | "dso";
export type SkyObj = {
  id: string; // "hip:91262", "planet:jupiter", "moon", "sun", "dso:M 45"
  kind: ObjKind;
  name: string;
  con?: string;
  mag: number;
  alt: number;
  az: number;
  ra?: number;
  dec?: number;
  tint?: number;
  type?: string; // for deep-sky objects
  phase?: number; // moon
};

export type SkyState = {
  date: Date;
  loc: Loc;
  sunAlt: number;
  objs: SkyObj[]; // stars sorted bright→faint, then planets, moon, dsos
  lines: { alt: number; az: number }[][];
  milky: { alt: number; az: number; w: number; s: number }[];
  cons: { name: string; alt: number; az: number }[];
};

export function computeSky(cat: Catalog, date: Date, loc: Loc): SkyState {
  const L = lst(date, loc.lon);
  const P = precessor(date);
  const hor = (ra: number, dec: number) => {
    const p = P(ra, dec);
    return eqToHor(p.ra, p.dec, loc.lat, L);
  };
  const objs: SkyObj[] = [];
  for (const [ra, dec, mag, tint, hip] of cat.stars) {
    const h = hor(ra, dec); // keep everything, even below the horizon: questions like "when does it rise" need it
    const nm = cat.names[hip];
    objs.push({ id: `hip:${hip}`, kind: "star", name: nm?.n ?? `HIP ${hip}`, con: nm?.c, mag, alt: h.alt, az: h.az, ra, dec, tint });
  }
  for (const p of planetsAltAz(date, loc)) {
    objs.push({ id: `planet:${p.name.toLowerCase()}`, kind: "planet", name: p.name, mag: p.mag, alt: p.alt, az: p.az });
  }
  const m = moonAltAz(date, loc);
  objs.push({ id: "moon", kind: "moon", name: "The Moon", mag: -10, alt: m.alt, az: m.az, phase: moonInfo(date).phase });
  const s = sunAltAz(date, loc);
  objs.push({ id: "sun", kind: "sun", name: "The Sun", mag: -26.7, alt: s.alt, az: s.az });
  for (const d of cat.dsos) {
    const h = hor(d.ra, d.dec);
    objs.push({ id: `dso:${d.id}`, kind: "dso", name: d.name, type: d.type, mag: d.mag, alt: h.alt, az: h.az, ra: d.ra, dec: d.dec });
  }
  const lines: SkyState["lines"] = [];
  for (const segs of Object.values(cat.lines)) {
    for (const seg of segs) lines.push(seg.map(([ra, dec]) => hor(ra, dec)));
  }
  const milky = MILKY.map((p) => ({ ...hor(p.ra, p.dec), w: p.w, s: p.s }));
  const cons = cat.cons.filter((c) => c.rank <= 2).map((c) => ({ name: c.name, ...hor(c.ra, c.dec) }));
  return { date, loc, sunAlt: s.alt, objs, lines, milky, cons };
}

/** Faintest magnitude visible: twilight first, then the user's own sky (from Sky Check). */
export function visibleLimit(sunAlt: number, userLimit: number) {
  const tw: [number, number][] = [[0, -1.6], [-6, 1.2], [-12, 3.2], [-18, 6.2]];
  let lim = 6.2;
  if (sunAlt >= 0) lim = -1.6;
  else
    for (let i = 0; i < tw.length - 1; i++) {
      const [a1, l1] = tw[i];
      const [a2, l2] = tw[i + 1];
      if (sunAlt <= a1 && sunAlt >= a2) lim = l1 + ((a1 - sunAlt) / (a1 - a2)) * (l2 - l1);
    }
  return Math.min(lim, userLimit);
}

export type View = { az: number; alt: number; vfov: number };
export type Hit = { obj: SkyObj; x: number; y: number };
type DrawOpts = {
  limit: number;
  marks?: Set<string>;
  nicknames?: Record<string, string>;
  selected?: string | null;
  lines?: boolean;
  labels?: boolean;
  font?: string;
};

const CARD = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function drawLens(ctx: CanvasRenderingContext2D, w: number, h: number, sky: SkyState, view: View, o: DrawOpts): Hit[] {
  const project = projector(w, h, view.az, view.alt, view.vfov);
  const scale = Math.max(0.85, Math.min(1.5, h / 820));
  const lim = visibleLimit(sky.sunAlt, o.limit);
  const dark = Math.min(1, Math.max(0, (-sky.sunAlt - 2) / 14));

  // sky
  const [top, mid, horC] = skyColors(Math.max(-90, sky.sunAlt), false);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgb(top));
  g.addColorStop(0.6, rgb(mid));
  g.addColorStop(1, rgb(horC));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Milky Way glow (dark skies only, and only if the user's sky can show it)
  if (dark > 0.6 && o.limit >= 4.6) {
    ctx.globalCompositeOperation = "lighter";
    const sprite = glow();
    for (const m of sky.milky) {
      if (m.alt < -1) continue;
      const q = project(m.alt, m.az, 80);
      if (!q) continue;
      const s = m.s * 2.4 * scale;
      ctx.globalAlpha = 0.07 * m.w * dark * Math.min(1, (o.limit - 4.4) / 1.4);
      ctx.drawImage(sprite, q.x - s, q.y - s, s * 2, s * 2);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  // constellation figures
  if (o.lines !== false) {
    ctx.strokeStyle = `rgba(214,198,160,${0.12 + 0.18 * dark})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const seg of sky.lines) {
      let prev: { x: number; y: number } | null = null;
      for (const p of seg) {
        const q = p.alt > -1 ? project(p.alt, p.az, 200) : null;
        if (q && prev) {
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(q.x, q.y);
        }
        prev = q;
      }
    }
    ctx.stroke();
  }

  // objects
  const hits: Hit[] = [];
  const labels: { x: number; y: number; t: string; c: string; pri: number }[] = [];
  for (const ob of sky.objs) {
    if (ob.alt < -0.5) continue;
    const q = project(ob.alt, ob.az);
    if (!q) continue;
    if (ob.kind === "star") {
      if (ob.mag > lim) continue;
      const a = Math.min(1, (lim - ob.mag) / 1.1 + 0.45);
      drawStar(ctx, q.x, q.y, ob.mag, TINTS[ob.tint ?? 1], a, (h > w ? 1.3 : 1.12) * scale);
      hits.push({ obj: ob, x: q.x, y: q.y });
      if (o.labels !== false && ob.mag < 1.6 && !ob.name.startsWith("HIP")) labels.push({ x: q.x, y: q.y, t: ob.name, c: "rgba(243,241,234,.7)", pri: 2 });
    } else if (ob.kind === "planet") {
      if (ob.mag > lim + 1) continue;
      drawStar(ctx, q.x, q.y, Math.min(ob.mag, -0.4), "#ffe9c2", 1, 1.2 * scale);
      hits.push({ obj: ob, x: q.x, y: q.y });
      if (o.labels !== false) labels.push({ x: q.x, y: q.y, t: ob.name, c: "#ffe2b0", pri: 3 });
    } else if (ob.kind === "moon") {
      drawMoon(ctx, q.x, q.y, 11 * scale, ob.phase ?? 0);
      hits.push({ obj: ob, x: q.x, y: q.y });
      if (o.labels !== false) labels.push({ x: q.x, y: q.y + 10, t: "Moon", c: "#f4ecdc", pri: 4 });
    } else if (ob.kind === "sun") {
      ctx.globalAlpha = 0.9;
      const s = 70 * scale;
      ctx.drawImage(glow(), q.x - s, q.y - s, s * 2, s * 2);
      ctx.fillStyle = "#fff1cf";
      ctx.beginPath();
      ctx.arc(q.x, q.y, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      hits.push({ obj: ob, x: q.x, y: q.y });
    } else if (ob.kind === "dso") {
      if (ob.mag > lim + 0.5) continue;
      ctx.strokeStyle = "rgba(201,214,232,.55)";
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(q.x, q.y, 6 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      hits.push({ obj: ob, x: q.x, y: q.y });
      if (o.labels !== false && ob.mag < 4.5) labels.push({ x: q.x, y: q.y, t: ob.name, c: "rgba(201,214,232,.6)", pri: 1 });
    }
    if (o.marks?.has(ob.id)) {
      ctx.strokeStyle = "#e5533d";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 11 * scale, 0, Math.PI * 2);
      ctx.stroke();
      labels.push({ x: q.x, y: q.y, t: o.nicknames?.[ob.id] ? `“${o.nicknames[ob.id]}”` : ob.name, c: "#ff8a73", pri: 5 });
    }
    if (o.selected === ob.id) {
      const r = 17 * scale;
      ctx.strokeStyle = "#f3f1ea";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        ctx.moveTo(q.x + dx * r, q.y + dy * r);
        ctx.lineTo(q.x + dx * (r + 7), q.y + dy * (r + 7));
      }
      ctx.stroke();
    }
  }

  // constellation names, faint
  if (o.labels !== false && dark > 0.3) {
    for (const c of sky.cons) {
      if (c.alt < 5) continue;
      const q = project(c.alt, c.az);
      if (q) labels.push({ x: q.x, y: q.y, t: c.name.toUpperCase(), c: "rgba(214,198,160,.35)", pri: 0 });
    }
  }

  // labels, highest priority first, skipping collisions
  ctx.font = o.font ?? `${Math.round(11 * scale)}px sans-serif`;
  ctx.textBaseline = "middle";
  const placed: { x: number; y: number; w: number }[] = [];
  labels.sort((a, b) => b.pri - a.pri);
  for (const l of labels) {
    const tw = ctx.measureText(l.t).width;
    const x = l.x + 10;
    const y = l.y;
    if (placed.some((p) => Math.abs(p.y - y) < 13 && x < p.x + p.w + 6 && x + tw + 6 > p.x)) continue;
    placed.push({ x, y, w: tw });
    ctx.fillStyle = l.c;
    ctx.fillText(l.t, x, y);
  }

  // ground: everything below the horizon
  ctx.fillStyle = "rgba(4,8,9,0.94)";
  ctx.beginPath();
  let started = false;
  for (let az = view.az - 120; az <= view.az + 120; az += 2) {
    const q = project(0, ((az % 360) + 360) % 360, 2000);
    if (!q) continue;
    if (!started) {
      ctx.moveTo(q.x, q.y);
      started = true;
    } else ctx.lineTo(q.x, q.y);
  }
  if (started) {
    ctx.lineTo(w + 2000, h + 2000);
    ctx.lineTo(-2000, h + 2000);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(180,154,107,.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // compass points on the horizon
  ctx.font = `600 ${Math.round(11 * scale)}px sans-serif`;
  ctx.textAlign = "center";
  for (let i = 0; i < 8; i++) {
    const q = project(0, i * 45, 0);
    if (!q) continue;
    ctx.fillStyle = i === 0 ? "#ff8a73" : "rgba(243,241,234,.75)";
    ctx.fillText(CARD[i], q.x, q.y + 16);
  }
  ctx.textAlign = "left";
  return hits;
}
