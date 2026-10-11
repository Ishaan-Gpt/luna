"use client";

import { useCallback, useState } from "react";
import type { Placed } from "@/lib/panorama";
import { compass } from "@/lib/sky";
import { HeroSky } from "./HeroSky";
import { Plus } from "./primitives";

const fists = (alt: number) => {
  const f = Math.max(1, Math.round(alt / 10));
  return `${f} fist${f > 1 ? "s" : ""}`;
};

/**
 * Tonight's sky, facing southwest from Hanle at 20:30, with a pin on each thing worth looking at.
 * Positions are computed, not placed by hand; the tooltips speak in fists, the way you'd point outdoors.
 */
export function SkyPins() {
  const [pins, setPins] = useState<(Placed & { px: number; py: number })[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const onPlaced = useCallback((placed: Placed[], { w, h }: { w: number; h: number }) => {
    const pick = placed
      .filter((p) => p.alt > 8 && p.x > w * 0.08 && p.x < w * 0.92 && p.y > h * 0.16 && p.y < h * 0.8)
      .sort((a, b) => a.mag - b.mag);
    const chosen: Placed[] = [];
    for (const p of pick) {
      if (chosen.length >= 6) break;
      if (chosen.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < Math.min(w, h) * 0.12)) continue;
      chosen.push(p);
    }
    setPins(chosen.map((p) => ({ ...p, px: (p.x / w) * 100, py: (p.y / h) * 100 })));
  }, []);

  return (
    <section data-bg="dark" className="relative h-[100svh] overflow-hidden bg-night text-star" aria-label="Tonight's sky with points of interest">
      <HeroSky mode="dark" onPlaced={onPlaced} az0={222} alt0={46} vfov={92} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

      {pins.map((p) => {
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="absolute" style={{ left: `${p.px}%`, top: `${p.py}%` }}>
            <button
              onPointerEnter={() => setOpen(p.id)}
              onPointerLeave={() => setOpen((o) => (o === p.id ? null : o))}
              onClick={() => setOpen((o) => (o === p.id ? null : p.id))}
              aria-expanded={isOpen}
              aria-label={`${p.name}: ${fists(p.alt)} above the ${compass(p.az)} horizon`}
              className="group relative -ml-[19px] -mt-[19px] grid h-[38px] w-[38px] place-items-center rounded-full"
            >
              <span className="absolute inset-0 rounded-full border border-star/60" style={{ animation: "pulse-ring 2.4s var(--ease-in) infinite" }} />
              <span className="absolute inset-0 rounded-full border border-star/40" style={{ animation: "pulse-ring 2.4s var(--ease-in) .8s infinite" }} />
              <span className="relative grid h-[26px] w-[26px] place-items-center rounded-full bg-star text-night transition-transform duration-700 group-hover:rotate-90" style={{ transitionTimingFunction: "var(--ease-out)" }}>
                <Plus size={13} />
              </span>
            </button>
            <div
              className={`pointer-events-none absolute left-1/2 top-[30px] w-max max-w-[220px] -translate-x-1/2 border border-star/20 bg-night/80 px-4 py-3 backdrop-blur-md transition-all duration-500 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
              style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
              <p className="t-display text-[clamp(20px,1.6vw,28px)]">{p.name}</p>
              <p className="t-label mt-1 text-star/70">
                {fists(p.alt)} up · {compass(p.az)}
              </p>
              <p className="t-label mt-1 text-star/50">{p.kind === "planet" ? "Planet" : p.kind === "moon" ? "Our moon" : p.con} · mag {p.mag.toFixed(1)}</p>
            </div>
          </div>
        );
      })}

      <div className="gut pointer-events-none absolute bottom-[8vh] left-0 max-lg:bottom-[6vh] lg:pl-[calc(var(--gutter)+130px)]" data-reveal-group>
        <h2 className="t-display t-h4 max-lg:!text-[12vw]">
          <span data-reveal="h" className="block">Worth your eyes</span>
          <span data-reveal="h" className="block">tonight</span>
        </h2>
        <p data-reveal="ctn" className="t-label mt-5 text-star/60">Hanle · 20:30 tonight · facing southwest · positions computed live</p>
      </div>
    </section>
  );
}
