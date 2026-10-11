"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawLens, type Hit, type View } from "@/lib/lens";
import { fam, setupCanvas } from "@/lib/draw";
import { angDist, dirWord } from "@/lib/ground";
import { fmtDate, fmtTime, ymd, zoned } from "@/lib/sky";
import { usePointer } from "./Shell";
import { useApp } from "./store";
import { GCalendar, GCompass } from "./ui";
import { ObjectSheet } from "./ObjectSheet";

// portrait phones need a taller field of view to show a useful width of sky
const startView = (lat: number): View => ({ az: lat >= 0 ? 180 : 0, alt: 42, vfov: typeof window !== "undefined" && window.innerHeight > window.innerWidth ? 104 : 74 });

export function SkyTab() {
  const app = useApp();
  const { sky, settings, marks, nicknames, selected, select, time, live, offsetMin, setOffsetMin, setTime, loc } = app;
  const pointer = usePointer();
  const [follow, setFollow] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const view = useRef<View>(startView(loc.lat));
  const hits = useRef<Hit[]>([]);
  const raf = useRef(0);
  const [vs, setVs] = useState<View>(() => startView(loc.lat)); // snapshot of the view for rendering
  const markSet = useMemo(() => new Set(marks), [marks]);

  // follow the phone once the sensor is live
  useEffect(() => {
    if (pointer.state === "live" && follow && pointer.pointing) {
      view.current = { ...view.current, az: pointer.pointing.az, alt: Math.max(-20, Math.min(88, pointer.pointing.alt)) };
    }
  }, [pointer.pointing, pointer.state, follow]);

  const draw = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const c = canvas.current;
      const el = wrap.current;
      if (!c || !el || !sky) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const ctx = setupCanvas(c, w, h);
      hits.current = drawLens(ctx, w, h, sky, view.current, {
        limit: settings.limit ?? 4.5,
        marks: markSet,
        nicknames,
        selected,
        font: `${Math.round(Math.max(11, Math.min(14, h / 62)))}px ${fam("--font-hanken")}`,
      });
      setVs({ ...view.current });
    });
  }, [sky, settings.limit, markSet, nicknames, selected]);

  useEffect(() => {
    draw();
  }, [draw, pointer.pointing, follow]);
  useEffect(() => {
    const r = () => draw();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, [draw]);

  // drag to look around, pinch or wheel to zoom, tap to pick
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ x: number; y: number; az: number; alt: number; dist?: number; vfov: number; moved: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...ptrs.current.values()];
    start.current = { x: e.clientX, y: e.clientY, az: view.current.az, alt: view.current.alt, vfov: view.current.vfov, moved: false, dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId) || !start.current) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...ptrs.current.values()];
    const s = start.current;
    if (pts.length === 2 && s.dist) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      view.current.vfov = Math.max(18, Math.min(120, (s.vfov * s.dist) / d));
      s.moved = true;
      draw();
      return;
    }
    const h = wrap.current!.clientHeight;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) s.moved = true;
    if (follow && pointer.state === "live") return;
    const k = view.current.vfov / h;
    view.current.az = (s.az - dx * k + 360) % 360;
    view.current.alt = Math.max(-20, Math.min(88, s.alt + dy * k));
    draw();
  };
  const onUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId);
    const s = start.current;
    if (s && !s.moved && ptrs.current.size === 0) {
      const r = canvas.current!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      let best: Hit | null = null;
      let bd = 30 * 30;
      for (const h of hits.current) {
        const d = (h.x - x) ** 2 + (h.y - y) ** 2;
        const bias = h.obj.mag * 6; // prefer bright things when crowded
        if (d + bias < bd) {
          bd = d + bias;
          best = h;
        }
      }
      if (best) select(best.obj.id);
    }
    if (ptrs.current.size === 0) start.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    view.current.vfov = Math.max(18, Math.min(120, view.current.vfov * (e.deltaY > 0 ? 1.08 : 0.92)));
    draw();
  };

  // what sits under the reticle when following the phone
  const centre = useMemo(() => {
    if (!sky || !follow || pointer.state !== "live") return null;
    const v = vs;
    return sky.objs
      .filter((o) => o.alt > 0 && o.kind !== "sun" && (o.kind !== "star" || o.mag <= (settings.limit ?? 4.5)))
      .map((o) => ({ o, d: angDist(o, v) }))
      .filter((x) => x.d < 6)
      .sort((a, b) => a.d * 0.6 + a.o.mag * 0.4 - (b.d * 0.6 + b.o.mag * 0.4))[0]?.o ?? null;
  }, [sky, follow, vs, pointer.state, settings.limit]);

  // guide arrow toward the selected object when it's off screen
  const guide = useMemo(() => {
    if (!sky || !selected) return null;
    const o = sky.objs.find((x) => x.id === selected);
    if (!o) return null;
    const v = vs;
    if (angDist(o, v) < v.vfov * 0.42) return null;
    let daz = o.az - v.az;
    if (daz > 180) daz -= 360;
    if (daz < -180) daz += 360;
    const ang = Math.atan2(-(o.alt - v.alt), daz) * (180 / Math.PI);
    return { ang, label: `${Math.abs(daz) > 20 ? (daz > 0 ? "Turn right" : "Turn left") : o.alt > v.alt ? "Look up" : "Look down"} · ${o.name}` };
  }, [sky, selected, vs]);

  const startFollow = async () => {
    if (pointer.state === "needs-permission") await pointer.request();
    setFollow(true);
  };

  const dateValue = ymd(time, loc.tz);
  const pointingText = follow && pointer.pointing ? `${Math.round(pointer.pointing.az)}° ${dirWord(pointer.pointing.az)} · ${Math.round(pointer.pointing.alt)}° up` : `${Math.round(vs.az)}° ${dirWord(vs.az)} · ${Math.round(vs.alt)}° up`;

  return (
    <div className="absolute inset-0">
      <div ref={wrap} className="absolute inset-0 touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" role="img" aria-label="The sky above you, computed live. Drag to look around, tap a star for details." />
        {!sky && <div className="absolute inset-0 grid place-items-center"><p className="t-label text-star/60">Placing 5,000 stars…</p></div>}
      </div>

      {/* reticle + what's in it */}
      {follow && pointer.state === "live" && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-16 w-16 rounded-full border border-star/60" />
          {centre && (
            <button className="pointer-events-auto absolute left-1/2 top-[76px] -translate-x-1/2 whitespace-nowrap rounded-full border border-star/25 bg-night/70 px-4 py-2 backdrop-blur" onClick={() => select(centre.id)}>
              <span className="t-display text-[22px] leading-none">{nicknames[centre.id] ? `“${nicknames[centre.id]}”` : centre.name}</span>
            </button>
          )}
        </div>
      )}
      {guide && (
        <div className="pointer-events-none absolute left-1/2 top-1/2">
          <span
            className="absolute block h-0 w-0 border-y-[9px] border-l-[16px] border-y-transparent border-l-torch"
            style={{ transform: `translate(-50%, -50%) translate(${Math.cos((guide.ang * Math.PI) / 180) * 120}px, ${Math.sin((guide.ang * Math.PI) / 180) * 120}px) rotate(${guide.ang}deg)` }}
          />
          <p className="t-label absolute left-0 top-[140px] -translate-x-1/2 whitespace-nowrap text-torch">{guide.label}</p>
        </div>
      )}

      {/* direction readout + follow switch */}
      <div className="absolute inset-x-0 top-[calc(74px+env(safe-area-inset-top,0px))] z-20 flex flex-col items-center gap-2">
        <p className="t-label tnum text-star/70">{pointingText}</p>
        {pointer.state !== "unsupported" ? (
          <button onClick={() => (follow ? setFollow(false) : startFollow())} className={`t-label flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur ${follow ? "border-torch text-torch" : "border-star/30 text-star/85"}`}>
            <GCompass size={16} /> {follow ? (pointer.state === "live" ? "Following your phone" : pointer.state === "denied" ? "Compass blocked" : "Waiting for compass…") : "Point your phone at the sky"}
          </button>
        ) : (
          <p className="t-label text-star/45">Drag to look around · scroll to zoom</p>
        )}
      </div>

      {/* time: live, scrub ±12 h, or any date */}
      <div className="absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-20 mx-auto w-full max-w-[560px] px-4">
        <div className="rounded-2xl border border-star/12 bg-night/75 px-4 pb-3 pt-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="t-display tnum text-[26px] leading-none">{fmtTime(time, loc.tz)}</p>
              <p className="t-label text-star/50">{fmtDate(time, loc.tz, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-star/25" aria-label="Pick a date">
                <GCalendar size={18} />
                <input
                  type="date"
                  min="1000-01-01"
                  max="2999-12-31"
                  value={dateValue}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    if (!y) return;
                    const [hh, mm] = fmtTime(app.now, loc.tz).split(":").map(Number);
                    setTime(zoned(y, m - 1, d, hh, mm, loc.tz));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <button onClick={() => setTime(null)} disabled={live} className={`t-label h-10 rounded-full border px-4 ${live ? "border-torch/60 text-torch" : "border-star/30 text-star"}`}>
                {live ? "Live" : "Now"}
              </button>
            </div>
          </div>
          <input aria-label="Move through the night" type="range" min={-720} max={720} step={10} value={offsetMin} onChange={(e) => setOffsetMin(Number(e.target.value))} className="mt-3 w-full accent-[#e5533d]" />
        </div>
      </div>

      <ObjectSheet />
    </div>
  );
}
