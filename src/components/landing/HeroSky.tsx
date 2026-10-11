"use client";

import { useEffect, useRef, useState } from "react";
import { drawPanorama, type Placed, type SkyMode } from "@/lib/panorama";
import { setupCanvas } from "@/lib/draw";
import { HANLE, ymd, zoned, type Loc } from "@/lib/sky";

/** Tonight at the given local time (default 20:30) at a place, as a Date. Call after mount. */
export function tonightAt(loc: Loc, hour = 20, minute = 30) {
  const [y, m, d] = ymd(new Date(), loc.tz).split("-").map(Number);
  return zoned(y, m - 1, d, hour, minute, loc.tz);
}

/**
 * Full-bleed canvas of the real sky. Both modes are painted once and cross-faded,
 * so switching city/dark costs nothing.
 */
export function HeroSky({ mode, loc = HANLE, onPlaced, az0 = 228, alt0 = 36, vfov, className = "" }: {
  mode: SkyMode; loc?: Loc; onPlaced?: (p: Placed[], size: { w: number; h: number }) => void;
  az0?: number; alt0?: number; vfov?: number; className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const dark = useRef<HTMLCanvasElement>(null);
  const city = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const paint = () => {
      const el = wrap.current;
      if (!el || !dark.current || !city.current) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const date = tonightAt(loc);
      const opts = { date, loc, az0, alt0, vfov };
      const placed = drawPanorama(setupCanvas(dark.current, w, h), w, h, { ...opts, mode: "dark" });
      drawPanorama(setupCanvas(city.current, w, h), w, h, { ...opts, mode: "city" });
      onPlaced?.(placed, { w, h });
      setPainted(true);
    };
    const t = setTimeout(paint, 0);
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(paint, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      clearTimeout(rt);
      window.removeEventListener("resize", onResize);
    };
  }, [loc, az0, alt0, vfov, onPlaced]);

  return (
    <div ref={wrap} className={`absolute inset-0 ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-b from-[#060b0e] via-[#0b171b] to-[#1b3630] transition-opacity duration-700 ${painted ? "opacity-0" : "opacity-100"}`} />
      <canvas ref={dark} className="absolute inset-0 h-full w-full transition-opacity duration-[1200ms]" style={{ opacity: mode === "dark" ? 1 : 0, transitionTimingFunction: "var(--ease-inout)" }} />
      <canvas ref={city} className="absolute inset-0 h-full w-full transition-opacity duration-[1200ms]" style={{ opacity: mode === "city" ? 1 : 0, transitionTimingFunction: "var(--ease-inout)" }} />
    </div>
  );
}
