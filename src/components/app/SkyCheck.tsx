"use client";

import { useMemo } from "react";
import type { Catalog } from "@/lib/catalog";
import { eqToHor, lst, precessor, sunAltAz, type Loc } from "@/lib/sky";

export const LEVELS = [
  { mag: 1.5, words: "Only a few", bortle: "Inner city" },
  { mag: 2.5, words: "The main shape", bortle: "City" },
  { mag: 3.5, words: "Shape plus a few", bortle: "Suburb" },
  { mag: 4.5, words: "Many faint stars", bortle: "Town edge" },
  { mag: 5.5, words: "Crowded with stars", bortle: "Dark sky" },
];

/** Bortle class from naked-eye limiting magnitude, using the standard ranges. */
export function bortleFor(mag: number) {
  const t: [number, number][] = [[7.6, 1], [7.1, 2], [6.6, 3], [6.1, 4], [5.6, 5], [5.1, 6], [4.6, 7], [4.1, 8]];
  for (const [m, b] of t) if (mag >= m) return b;
  return 9;
}

type Fig = { id: string; name: string; stars: { x: number; y: number; mag: number }[]; lines: [number, number][][] };

/** The well-known constellation best placed in this sky right now, with every catalogue star in its frame. */
export function figureForNow(cat: Catalog, date: Date, loc: Loc): Fig | null {
  const L = lst(date, loc.lon);
  const P = precessor(date);
  const altOf = (ra: number, dec: number) => {
    const p = P(ra, dec);
    return eqToHor(p.ra, p.dec, loc.lat, L).alt;
  };
  const famous = ["Ori", "UMa", "Cas", "Cyg", "Sco", "Leo", "Gem", "Tau", "Lyr", "Sgr", "Cru", "Peg", "Aql", "Boo", "CMa"];
  let best: { id: string; min: number } | null = null;
  for (const id of famous) {
    const segs = cat.lines[id];
    if (!segs) continue;
    const alts = segs.flat().map(([ra, dec]) => altOf(ra, dec));
    const min = Math.min(...alts);
    if (min > 12 && (!best || min > best.min)) best = { id, min };
  }
  const id = best?.id ?? (loc.lat >= 0 ? "UMa" : "Cru");
  const segs = cat.lines[id];
  const pts = segs.flat();
  const ra0 = pts[0][0];
  const unwrap = (ra: number) => {
    let d = ra - ra0;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };
  const dec0 = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const k = Math.cos((dec0 * Math.PI) / 180);
  const xs = pts.map(([ra]) => -unwrap(ra) * k);
  const ys = pts.map(([, dec]) => -dec);
  const pad = 3;
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
  const span = Math.max(x1 - x0, y1 - y0);
  const map = (ra: number, dec: number) => ({
    x: 6 + ((-unwrap(ra) * k - x0) / span) * 88 + (88 - ((x1 - x0) / span) * 88) / 2,
    y: 6 + ((-dec - y0) / span) * 88 + (88 - ((y1 - y0) / span) * 88) / 2,
  });
  const stars = cat.stars
    .filter(([ra, dec]) => {
      const x = -unwrap(ra) * k;
      const y = -dec;
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    })
    .map(([ra, dec, mag]) => ({ ...map(ra, dec), mag }));
  const lines = segs.map((seg) => seg.map(([ra, dec]) => {
    const m = map(ra, dec);
    return [m.x, m.y] as [number, number];
  }));
  return { id, name: cat.cons.find((c) => c.id === id)?.name ?? id, stars, lines };
}

export function FigureTile({ fig, limit, active, onPick, label, sub }: { fig: Fig; limit: number; active: boolean; onPick: () => void; label: string; sub: string }) {
  return (
    <button onClick={onPick} aria-pressed={active} className={`group relative flex flex-col overflow-hidden rounded-[18px] border text-left transition-colors ${active ? "border-torch bg-white/[0.05]" : "border-star/15 hover:border-star/40"}`}>
      <svg viewBox="0 0 100 100" className="aspect-square w-full" aria-hidden>
        {fig.lines.map((seg, i) => (
          <polyline key={i} points={seg.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="#c9b98f" strokeOpacity=".25" strokeWidth=".5" />
        ))}
        {fig.stars.filter((s) => s.mag <= limit).map((s, i) => (
          <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={Math.max(0.45, 2.6 - s.mag * 0.42).toFixed(2)} fill="#f3f1ea" opacity={Math.min(1, 0.35 + (limit - s.mag) * 0.4)} />
        ))}
      </svg>
      <span className="px-3 pb-3">
        <span className="t-label block text-star/85">{label}</span>
        <span className="t-label block text-star/45">{sub}</span>
      </span>
    </button>
  );
}

export function SkyCheck({ cat, date, loc, value, onPick }: { cat: Catalog; date: Date; loc: Loc; value: number | null; onPick: (mag: number) => void }) {
  const fig = useMemo(() => figureForNow(cat, date, loc), [cat, date, loc]);
  const day = sunAltAz(date, loc).alt > -8;
  if (!fig) return null;
  return (
    <div>
      <p className="t-body text-star/75">
        {day ? `It's still light where you are, so do this after dark. Find ${fig.name}` : `Step outside, let your eyes settle for a minute, and find ${fig.name}`} and pick the picture that looks most like your sky.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <FigureTile key={l.mag} fig={fig} limit={l.mag} active={value === l.mag} onPick={() => onPick(l.mag)} label={l.words} sub={`${l.bortle} · mag ${l.mag}`} />
        ))}
      </div>
    </div>
  );
}
