"use client";

import { useEffect, useRef, useState } from "react";
import { DUST, MILKY, eqToHor, lst, precessor, moonAltAz, moonInfo, planetsAltAz, sunAltAz, type Loc } from "@/lib/sky";
import { LINES, STARS, STAR_BY_ID } from "@/lib/stars";
import { TINT, darkness, drawMoon, drawStar, fam, glow, rgb, setupCanvas, skyColors } from "@/lib/draw";

type Props = {
  date: Date | null;
  loc: Loc;
  selected?: string | null;
  onSelect?: (id: string) => void;
  marks?: string[];
  nicknames?: Record<string, string>;
  overheadId?: string | null;
  showLabels?: boolean;
  showSunMoon?: boolean;
  className?: string;
  label?: string;
};

const D2R = Math.PI / 180;

/**
 * All-sky chart, as on a planisphere: zenith in the centre, horizon at the rim, north up, east left.
 * Real positions for the given time and place. Click a star to select it.
 */
export function SkyDial({
  date, loc, selected, onSelect, marks = [], nicknames = {}, overheadId, showLabels = true, showSunMoon = true, className = "", label,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hits = useRef<{ id: string; x: number; y: number }[]>([]);
  const [size, setSize] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !size || !date) return;
    const ctx = setupCanvas(c, size, size);
    const W = size;
    const cx = W / 2;
    const cy = W / 2;
    const R = W / 2 - Math.max(18, W * 0.06);
    ctx.clearRect(0, 0, W, W);

    const sun = sunAltAz(date, loc);
    const vis = Math.max(0.25, darkness(sun.alt));
    const [top, mid, rim] = skyColors(sun.alt, false);
    const L = lst(date, loc.lon);
    const P = precessor(date);
    const hor = (ra: number, dec: number) => {
      const p = P(ra, dec);
      return eqToHor(p.ra, p.dec, loc.lat, L);
    };
    const project = (alt: number, az: number) => {
      const r = ((90 - alt) / 90) * R;
      return { x: cx - r * Math.sin(az * D2R), y: cy - r * Math.cos(az * D2R) };
    };

    // Disc
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, rgb(top, 0.92));
    bg.addColorStop(0.75, rgb(mid, 0.92));
    bg.addColorStop(1, rgb(rim, 0.95));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Milky Way
    ctx.globalCompositeOperation = "lighter";
    const g = glow();
    const ms = W / 520;
    for (const m of MILKY) {
      const p = hor(m.ra, m.dec);
      if (p.alt < 0) continue;
      const q = project(p.alt, p.az);
      const s = m.s * ms;
      ctx.globalAlpha = vis * vis * 0.06 * m.w;
      ctx.drawImage(g, q.x - s, q.y - s, s * 2, s * 2);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // Altitude rings
    ctx.strokeStyle = "rgba(180,154,107,0.22)";
    ctx.lineWidth = 0.7;
    ctx.setLineDash([2, 4]);
    for (const a of [30, 60]) {
      ctx.beginPath();
      ctx.arc(cx, cy, ((90 - a) / 90) * R, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Faint field
    const limit = -1.5 + vis * 7.2;
    ctx.fillStyle = "#efe8da";
    for (const d of DUST) {
      if (d.mag > limit - 0.4) continue;
      const p = hor(d.ra, d.dec);
      if (p.alt < 0) continue;
      const q = project(p.alt, p.az);
      ctx.globalAlpha = Math.min(1, (limit - d.mag) / 1.6) * 0.45;
      ctx.fillRect(q.x, q.y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Stars
    const placed = new Map<string, { x: number; y: number; alt: number }>();
    for (const s of STARS) {
      const p = hor(s.ra, s.dec);
      if (p.alt > -1) placed.set(s.id, { ...project(p.alt, p.az), alt: p.alt });
    }
    ctx.strokeStyle = `rgba(180,154,107,${0.32 + 0.18 * vis})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const [a, b] of LINES) {
      const pa = placed.get(a), pb = placed.get(b);
      if (!pa || !pb) continue;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    }
    ctx.stroke();

    const k = Math.max(0.75, W / 480);
    hits.current = [];
    for (const s of STARS) {
      const q = placed.get(s.id);
      if (!q || q.alt < 0) continue;
      const a = s.mag < limit ? 1 : 0.35;
      drawStar(ctx, q.x, q.y, s.mag, TINT[s.tint ?? "white"], a, k);
      hits.current.push({ id: s.id, x: q.x, y: q.y });
    }

    // Planets
    ctx.font = `${Math.max(9, W / 52)}px ${fam("--font-martian")}`;
    for (const p of planetsAltAz(date, loc)) {
      if (p.alt < 0) continue;
      const q = project(p.alt, p.az);
      ctx.fillStyle = "#ffe7b8";
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(2, 3.2 - p.mag * 0.4) * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,231,184,0.5)";
      ctx.beginPath();
      ctx.arc(q.x, q.y, 6 * k, 0, Math.PI * 2);
      ctx.stroke();
      if (showLabels) {
        ctx.fillStyle = "rgba(255,231,184,0.85)";
        ctx.fillText(p.name, q.x + 9 * k, q.y + 3);
      }
    }

    // Moon and Sun
    if (showSunMoon) {
      const mp = moonAltAz(date, loc);
      if (mp.alt > 0) {
        const q = project(mp.alt, mp.az);
        drawMoon(ctx, q.x, q.y, 7 * k, moonInfo(date).phase);
      }
      if (sun.alt > 0) {
        const q = project(sun.alt, sun.az);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(g, q.x - 30 * k, q.y - 30 * k, 60 * k, 60 * k);
        ctx.fillStyle = "#ffe4b5";
        ctx.beginPath();
        ctx.arc(q.x, q.y, 7 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Labels for bright stars
    const fs = Math.max(9, W / 50);
    ctx.font = `${fs}px ${fam("--font-hanken")}`;
    const lab = (id: string, text: string, color: string, dy = -10) => {
      const q = placed.get(id);
      if (!q || q.alt < 0) return;
      ctx.fillStyle = color;
      ctx.textAlign = q.x > cx + R * 0.55 ? "right" : "left";
      ctx.fillText(text, q.x + (ctx.textAlign === "right" ? -8 : 8), q.y + dy * (k / 1.4));
      ctx.textAlign = "left";
    };
    if (showLabels) {
      for (const s of STARS) if (s.mag < 0.9 && !marks.includes(s.id) && s.id !== selected && s.id !== overheadId) lab(s.id, s.name, "rgba(242,234,219,0.62)", 4);
    }

    // Overhead
    if (overheadId && placed.get(overheadId)) {
      const q = placed.get(overheadId)!;
      ctx.strokeStyle = "rgba(242,234,219,0.75)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 13 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      lab(overheadId, `${STAR_BY_ID[overheadId].name} · overhead`, "rgba(242,234,219,0.95)", -12);
    }

    // Marks
    for (const id of marks) {
      const q = placed.get(id);
      if (!q || q.alt < 0) continue;
      ctx.strokeStyle = "#e5533d";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 9 * k, 0, Math.PI * 2);
      ctx.stroke();
      if (id !== selected) lab(id, nicknames[id] ? `“${nicknames[id]}”` : STAR_BY_ID[id].name, "#ff8a73", 4);
    }

    // Selected / hover
    for (const id of [selected, hover]) {
      if (!id) continue;
      const q = placed.get(id);
      if (!q || q.alt < 0) continue;
      ctx.strokeStyle = id === selected ? "#e5533d" : "rgba(242,234,219,0.6)";
      ctx.lineWidth = 1.2;
      const r = 14 * k;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        ctx.moveTo(q.x + dx * r, q.y + dy * r);
        ctx.lineTo(q.x + dx * (r + 6 * k), q.y + dy * (r + 6 * k));
      }
      ctx.stroke();
      if (id === selected) {
        const name = STAR_BY_ID[id].name;
        lab(id, nicknames[id] ? `“${nicknames[id]}” · ${name}` : name, "#ff8a73", -16);
      }
    }
    ctx.restore();

    // Bezel: horizon ring, ticks, cardinal points
    ctx.strokeStyle = "rgba(180,154,107,0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const len = i % 18 === 0 ? 10 : i % 6 === 0 ? 6 : 3;
      ctx.moveTo(cx - Math.sin(a) * (R + 3), cy - Math.cos(a) * (R + 3));
      ctx.lineTo(cx - Math.sin(a) * (R + 3 + len * (W / 520)), cy - Math.cos(a) * (R + 3 + len * (W / 520)));
    }
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.font = `${Math.max(9, W / 46)}px ${fam("--font-martian")}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const off = R + Math.max(11, W * 0.042);
    for (const [t, az] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const) {
      ctx.fillStyle = t === "N" ? "#ff8a73" : "rgba(242,234,219,0.7)";
      ctx.fillText(t, cx - Math.sin(az * D2R) * off, cy - Math.cos(az * D2R) * off);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }, [date, loc, size, selected, hover, marks, nicknames, overheadId, showLabels, showSunMoon]);

  const pick = (e: React.PointerEvent) => {
    const rect = canvas.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let best: string | null = null;
    let bd = 18 * 18;
    for (const h of hits.current) {
      const d = (h.x - x) ** 2 + (h.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = h.id;
      }
    }
    return best;
  };

  return (
    <div ref={wrap} className={`relative aspect-square w-full ${className}`}>
      {!date && <div className="skeleton absolute inset-[6%] rounded-full" />}
      <canvas
        ref={canvas}
        role="img"
        aria-label={label ?? "Live sky chart"}
        className={`absolute inset-0 h-full w-full ${onSelect && hover ? "cursor-pointer" : ""}`}
        onPointerMove={onSelect ? (e) => e.pointerType === "mouse" && setHover(pick(e)) : undefined}
        onPointerLeave={() => setHover(null)}
        onClick={onSelect ? (e) => {
          const id = pick(e as unknown as React.PointerEvent);
          if (id) onSelect(id);
        } : undefined}
      />
    </div>
  );
}
