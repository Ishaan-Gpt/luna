"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { useSky } from "@/lib/sky-context";
import { DUST, MILKY, lst, eqToHor, moonAltAz, moonInfo, sunAltAz } from "@/lib/sky";
import { STARS, STAR_BY_ID, LINES } from "@/lib/stars";
import { TINT, darkness, drawMoon, drawStar, glow, rgb, setupCanvas, skyColors } from "@/lib/draw";

const D2R = Math.PI / 180;

/**
 * The page's environment: tonight's real sky at the chosen location.
 * Scroll position is the clock. Sky colour comes from the real Sun altitude at that moment.
 */
export function SkyBackdrop() {
  const { progress, timeAt, loc, night } = useSky();
  const canvas = useRef<HTMLCanvasElement>(null);
  const wash = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const draw = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const c = canvas.current;
      const t = timeAt(progress.get());
      if (!c || !t || !night) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ctx = setupCanvas(c, w, h);
      ctx.clearRect(0, 0, w, h);

      const sun = sunAltAz(t, loc).alt;
      const midnight = (night.sunset.getTime() + night.sunrise.getTime()) / 2;
      const dawn = t.getTime() > midnight;
      const [top, mid, hor] = skyColors(sun, dawn);
      if (wash.current) {
        wash.current.style.background = `linear-gradient(180deg, ${rgb(top)} 0%, ${rgb(mid)} 58%, ${rgb(hor)} 100%)`;
      }

      // Camera: facing the equator-side sky, looking 38° up. Stereographic projection.
      const az0 = (loc.lat >= 0 ? 180 : 0) * D2R;
      const a0 = 38 * D2R;
      const f = [Math.sin(az0) * Math.cos(a0), Math.cos(az0) * Math.cos(a0), Math.sin(a0)];
      const r = [Math.cos(az0), -Math.sin(az0), 0];
      const u = [-Math.sin(a0) * Math.sin(az0), -Math.sin(a0) * Math.cos(az0), Math.cos(a0)];
      const s = h / 2 / (2 * Math.tan((56 * D2R) / 2));
      const cx = w / 2;
      const cy = h / 2;
      const project = (alt: number, az: number) => {
        const A = alt * D2R, Z = az * D2R;
        const v = [Math.cos(A) * Math.sin(Z), Math.cos(A) * Math.cos(Z), Math.sin(A)];
        const dz = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
        if (dz < -0.2) return null;
        const k = 2 / (1 + dz);
        const x = cx + k * (v[0] * r[0] + v[1] * r[1]) * s;
        const y = cy - k * (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) * s;
        if (x < -40 || x > w + 40 || y < -40 || y > h + 40) return null;
        return { x, y };
      };

      const L = lst(t, loc.lon);
      const vis = darkness(sun);
      const limit = -1.6 + vis * 7.6;
      if (vis <= 0) return;

      // Milky Way haze
      ctx.globalCompositeOperation = "lighter";
      const g = glow();
      for (const m of MILKY) {
        const p = eqToHor(m.ra, m.dec, loc.lat, L);
        if (p.alt < -2) continue;
        const q = project(p.alt, p.az);
        if (!q) continue;
        ctx.globalAlpha = vis * vis * 0.05 * m.w;
        ctx.drawImage(g, q.x - m.s, q.y - m.s, m.s * 2, m.s * 2);
      }
      ctx.globalCompositeOperation = "source-over";

      // Faint field
      ctx.fillStyle = "#efe8da";
      for (const d of DUST) {
        if (d.mag > limit) continue;
        const p = eqToHor(d.ra, d.dec, loc.lat, L);
        if (p.alt < 0) continue;
        const q = project(p.alt, p.az);
        if (!q) continue;
        ctx.globalAlpha = Math.min(1, (limit - d.mag) / 1.4) * 0.55 * Math.min(1, p.alt / 6);
        ctx.fillRect(q.x, q.y, d.mag < 4.6 ? 1.3 : 0.9, d.mag < 4.6 ? 1.3 : 0.9);
      }
      ctx.globalAlpha = 1;

      // Stick figures, barely there
      const placed = new Map<string, { x: number; y: number; alt: number }>();
      for (const st of STARS) {
        const p = eqToHor(st.ra, st.dec, loc.lat, L);
        const q = p.alt > -3 ? project(p.alt, p.az) : null;
        if (q) placed.set(st.id, { ...q, alt: p.alt });
      }
      ctx.strokeStyle = `rgba(180,154,107,${0.16 * vis})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (const [a, b] of LINES) {
        const pa = placed.get(a), pb = placed.get(b);
        if (!pa || !pb || pa.alt < 0 || pb.alt < 0) continue;
        if (STAR_BY_ID[a].mag > limit && STAR_BY_ID[b].mag > limit) continue;
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
      }
      ctx.stroke();

      for (const st of STARS) {
        const q = placed.get(st.id);
        if (!q || q.alt < 0 || st.mag > limit) continue;
        const a = Math.min(1, (limit - st.mag) / 1.2) * Math.min(1, q.alt / 5 + 0.2);
        drawStar(ctx, q.x, q.y, st.mag, TINT[st.tint ?? "white"], a, 1.1);
      }

      // Moon
      const mp = moonAltAz(t, loc);
      if (mp.alt > -1) {
        const q = project(mp.alt, mp.az);
        if (q) drawMoon(ctx, q.x, q.y, 9, moonInfo(t).phase);
      }
    });
  };

  useMotionValueEvent(progress, "change", draw);
  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("resize", draw);
      cancelAnimationFrame(frame.current);
    };
  }); // redraw whenever location/night change

  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <div
        ref={wash}
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #3a4b5b 0%, #8a7a80 58%, #e8a77f 100%)" }}
      />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      {/* A low band of airglow / horizon haze */}
      <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}
