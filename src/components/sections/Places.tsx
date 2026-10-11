"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSky } from "@/lib/sky-context";
import { bearing, compass, distanceKm } from "@/lib/sky";
import { PLACES } from "@/lib/stars";
import { Reveal, SectionHeading } from "../motion-bits";
import { IconExternal, IconPin, IconRoute } from "../icons";

const fmtKm = (km: number) => (km < 1 ? "here" : km < 100 ? `${km.toFixed(0)} km` : `${Math.round(km).toLocaleString("en-IN")} km`);

export function Places() {
  const { loc } = useSky();
  const list = useMemo(
    () =>
      PLACES.map((p) => ({ ...p, km: distanceKm(loc, p), brg: bearing(loc, p) }))
        .sort((a, b) => a.km - b.km),
    [loc],
  );
  const [sel, setSel] = useState<string | null>(null);
  const place = list.find((p) => p.id === sel) ?? list.find((p) => p.km > 1) ?? list[0];

  return (
    <section id="places" className="relative z-10 mt-36 scroll-mt-24 px-4 sm:px-6 md:mt-52">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading plain="Darker skies" italic="are closer than you think." />
        <p className="mx-auto mt-6 max-w-[560px] text-center text-[1.05rem] leading-relaxed text-star-2">
          Luna keeps a list of places where the sky is properly dark, tells you which are near, and guides you there. Distances below are measured from {loc.own ? "where you are" : loc.name}.
        </p>

        <div className="mt-16 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <ul className="glass rounded-[28px] p-2 sm:p-3" aria-label="Dark-sky places">
              {list.map((p) => {
                const active = p.id === place.id;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setSel(p.id)}
                      className={`relative flex w-full items-center gap-4 rounded-[18px] px-4 py-3.5 text-left transition-colors ${active ? "" : "hover:bg-white/[0.04]"}`}
                    >
                      {active && <motion.span layoutId="place-bead" className="absolute inset-0 rounded-[18px] bg-white/[0.07] ring-1 ring-line-2" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                      <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-torch-soft text-torch-ink" : "glass-inset text-star-2"}`}>
                        <IconPin size={18} />
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="block truncate text-[0.82rem] text-star-3">{p.region}</span>
                      </span>
                      <span className="mono relative shrink-0 text-right text-[0.78rem] text-star-2 tnum">
                        {fmtKm(p.km)}
                        {p.km > 1 && <span className="block text-[0.68rem] text-star-3">{compass(p.brg)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass relative h-full overflow-hidden rounded-[28px] p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={place.id + loc.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full flex-col"
                >
                  <p className="text-[0.85rem] text-star-3">{place.region}</p>
                  <h3 className="display mt-1 text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.02]">{place.name}</h3>
                  <p className="mt-3 max-w-[420px] text-[1rem] leading-relaxed text-star-2">{place.note}</p>

                  <div className="mt-8 flex flex-1 flex-col items-center gap-8 sm:flex-row">
                    {/* Bearing rose */}
                    <div className="relative h-44 w-44 shrink-0">
                      <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
                        <circle cx="100" cy="100" r="92" fill="rgba(0,0,0,.22)" stroke="var(--brass)" strokeOpacity=".6" />
                        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--brass)" strokeOpacity=".2" strokeDasharray="2 4" />
                        {Array.from({ length: 72 }, (_, i) => {
                          const a = (i * 5 * Math.PI) / 180;
                          const r2 = i % 18 === 0 ? 78 : i % 6 === 0 ? 84 : 88;
                          return <line key={i} x1={(100 + Math.sin(a) * 92).toFixed(2)} y1={(100 - Math.cos(a) * 92).toFixed(2)} x2={(100 + Math.sin(a) * r2).toFixed(2)} y2={(100 - Math.cos(a) * r2).toFixed(2)} stroke="var(--brass)" strokeOpacity=".7" />;
                        })}
                        {(["N", "E", "S", "W"] as const).map((t, i) => {
                          const a = (i * 90 * Math.PI) / 180;
                          return <text key={t} x={(100 + Math.sin(a) * 66).toFixed(2)} y={(104 - Math.cos(a) * 66).toFixed(2)} textAnchor="middle" fontSize="11" fill={t === "N" ? "var(--torch-ink)" : "var(--star-3)"} className="mono">{t}</text>;
                        })}
                      </svg>
                      <motion.div className="absolute inset-0" initial={false} animate={{ rotate: place.km > 1 ? place.brg : 0 }} transition={{ type: "spring", stiffness: 70, damping: 12 }}>
                        <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
                          <path d="M100 30 L108 100 L100 112 L92 100 Z" fill="var(--torch)" />
                          <path d="M100 112 L106 100 L100 160 L94 100 Z" fill="var(--star-3)" opacity=".5" />
                          <circle cx="100" cy="100" r="4" fill="var(--star)" />
                        </svg>
                      </motion.div>
                    </div>

                    <div className="w-full">
                      <dl className="grid grid-cols-2 gap-4">
                        <div className="border-t border-line pt-3">
                          <dt className="text-[0.78rem] text-star-3">Distance</dt>
                          <dd className="mono mt-1 text-[1.25rem] tnum">{place.km > 1 ? fmtKm(place.km) : "You're here"}</dd>
                        </div>
                        <div className="border-t border-line pt-3">
                          <dt className="text-[0.78rem] text-star-3">Bearing</dt>
                          <dd className="mono mt-1 text-[1.25rem] tnum">{place.km > 1 ? `${Math.round(place.brg)}° ${compass(place.brg)}` : "—"}</dd>
                        </div>
                      </dl>
                      <div className="glass-inset mt-5 flex items-start gap-3 rounded-2xl p-4">
                        <IconRoute size={20} className="mt-0.5 shrink-0 text-torch-ink" />
                        <p className="text-[0.88rem] leading-snug text-star-2">
                          In the app: pick a place, download the route while you have signal, and follow it offline to the darkest spot.
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost mt-5 w-full justify-center sm:w-auto"
                      >
                        Preview the route in Maps <IconExternal size={17} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
