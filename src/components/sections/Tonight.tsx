"use client";

import { useMemo } from "react";
import { useSky } from "@/lib/sky-context";
import { fmtDate, fmtTime, moonInfo, upcomingEvents, type SkyEvent } from "@/lib/sky";
import { NightBar } from "../NightBar";
import { Reveal, SectionHeading } from "../motion-bits";
import { IconCloud, IconEclipse, IconMeteor, IconMoon, IconSeason } from "../icons";

const KIND_ICON: Record<SkyEvent["kind"], typeof IconMoon> = {
  moon: IconMoon,
  eclipse: IconEclipse,
  meteor: IconMeteor,
  season: IconSeason,
};

export function Tonight() {
  const { now, loc, night, weather, weatherState } = useSky();
  const dayKey = now ? now.toDateString() : null;
  const events = useMemo(() => (now ? upcomingEvents(now, loc, 6) : null), [dayKey, loc]); // eslint-disable-line react-hooks/exhaustive-deps
  const moon = night ? moonInfo(new Date((night.sunset.getTime() + night.sunrise.getTime()) / 2)) : null;

  const cloudTonight = useMemo(() => {
    if (!weather || !night) return null;
    const hrs = weather.hours.filter((h) => h.t >= night.sunset && h.t <= night.sunrise);
    if (!hrs.length) return null;
    return Math.round(hrs.reduce((a, h) => a + h.cloud, 0) / hrs.length);
  }, [weather, night]);

  const opens = night?.best ? fmtTime(night.best.start, loc.tz) : night?.darkStart ? fmtTime(night.darkStart, loc.tz) : null;
  const readouts = [
    { k: "Sunset", v: fmtTime(night?.sunset, loc.tz) },
    { k: "Truly dark", v: night?.darkStart ? `${fmtTime(night.darkStart, loc.tz)}–${fmtTime(night.darkEnd, loc.tz)}` : "Not tonight" },
    { k: "Sunrise", v: fmtTime(night?.sunrise, loc.tz) },
    { k: "Moon", v: moon ? `${Math.round(moon.fraction * 100)}% lit` : "—", s: moon?.name },
    { k: "Moonrise / set", v: `${fmtTime(night?.moonrise, loc.tz)} / ${fmtTime(night?.moonset, loc.tz)}` },
    {
      k: "Cloud tonight",
      v: weatherState === "ok" && cloudTonight !== null ? `${cloudTonight}%` : weatherState === "loading" ? "…" : "No signal",
      s: weatherState === "ok" ? (cloudTonight !== null && cloudTonight < 25 ? "Clear enough" : cloudTonight !== null && cloudTonight < 60 ? "Patchy" : "Mostly cloudy") : weatherState === "offline" ? "Sky maths still works" : undefined,
    },
  ];

  return (
    <section id="tonight" className="relative z-10 mt-36 scroll-mt-24 px-4 sm:px-6 md:mt-52">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading plain="Tonight's window" italic={opens ? `opens at ${opens}.` : "opens after dark."} />
        <p className="mx-auto mt-6 max-w-[580px] text-center text-[1.05rem] leading-relaxed text-star-2">
          Darkness, moonlight and clouds, combined into one honest answer for {loc.name}. When there&rsquo;s a signal Luna refreshes the forecast; when there isn&rsquo;t, everything else still works.
        </p>

        <div className="mt-16 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <div className="glass h-full rounded-[28px] p-5 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="display text-[1.9rem]">Sunset to sunrise</h3>
                <p className="mono text-[0.72rem] text-star-3">{night ? fmtDate(night.sunset, loc.tz, { weekday: "short", day: "numeric", month: "short" }) : ""}</p>
              </div>
              <div className="mt-10">
                <NightBar night={night} loc={loc} clouds={weather?.hours ?? null} />
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {readouts.map((r) => (
                  <div key={r.k} className="border-t border-line pt-3">
                    <dt className="text-[0.78rem] text-star-3">{r.k}</dt>
                    <dd className="mono mt-1 text-[1.05rem] tnum">{r.v}</dd>
                    {r.s && <dd className="text-[0.75rem] text-star-3">{r.s}</dd>}
                  </div>
                ))}
              </dl>
              {weatherState === "ok" && (
                <p className="mt-6 flex items-center gap-2 text-[0.72rem] text-star-3"><IconCloud size={14} /> Forecast from Open-Meteo</p>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass h-full rounded-[28px] p-5 sm:p-8">
              <h3 className="display text-[1.9rem]">Coming up <em className="text-star-2">in the sky</em></h3>
              <ul className="mt-6 divide-y divide-line">
                {events
                  ? events.map((e) => {
                      const Icon = KIND_ICON[e.kind];
                      return (
                        <li key={e.title + e.date.toISOString()} className="group flex gap-4 py-4">
                          <div className="w-14 shrink-0 text-center">
                            <p className="display text-[2rem] leading-none tnum">{fmtDate(e.date, loc.tz, { day: "numeric" })}</p>
                            <p className="mono text-[0.66rem] uppercase text-star-3">{fmtDate(e.date, loc.tz, { month: "short" })}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium">
                              <Icon size={17} className="text-torch-ink transition-transform duration-500 [transition-timing-function:var(--spring)] group-hover:-rotate-12" />
                              {e.title}
                            </p>
                            <p className="mt-1 text-[0.86rem] leading-snug text-star-3">{e.detail}</p>
                          </div>
                        </li>
                      );
                    })
                  : Array.from({ length: 5 }, (_, i) => <li key={i} className="py-4"><div className="skeleton h-12 w-full" /></li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
