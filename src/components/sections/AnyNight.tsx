"use client";

import { useEffect, useMemo, useState } from "react";
import { useSky } from "@/lib/sky-context";
import { compass, fmtDate, fmtTime, j2000ToHor, nextNewMoon, ymd, zoned } from "@/lib/sky";
import { STAR_BY_ID } from "@/lib/stars";
import { SkyDial } from "../SkyDial";
import { Reveal, SectionHeading } from "../motion-bits";
import { IconCalendar } from "../icons";

const AGED = ["betelgeuse", "vega", "sirius", "polaris", "arcturus", "deneb", "aldebaran", "rigel", "antares"];

const yearLabel = (y: number) => (y > 0 ? `${y}` : `${Math.abs(y) + 1} BCE`);

export function AnyNight() {
  const { now, loc } = useSky();
  const [day, setDay] = useState<string>("");
  const [mins, setMins] = useState(240); // minutes after 18:00
  const [sel, setSel] = useState("betelgeuse");

  useEffect(() => {
    if (now && !day) setTimeout(() => setDay(ymd(now, loc.tz)), 0);
  }, [now, day, loc.tz]);

  const date = useMemo(() => {
    if (!day) return null;
    const [y, m, d] = day.split("-").map(Number);
    if (!y || !m || !d) return null;
    return zoned(y, m - 1, d, 18, mins, loc.tz);
  }, [day, mins, loc.tz]);

  const presets = useMemo(() => {
    if (!now) return [];
    const y = +ymd(now, loc.tz).slice(0, 4);
    const orionids = new Date(Date.UTC(now.getTime() > Date.UTC(y, 9, 22) ? y + 1 : y, 9, 21, 12));
    return [
      { label: "Tonight", day: ymd(now, loc.tz), mins: 240 },
      { label: "Orionids peak", day: ymd(orionids, loc.tz), mins: 600 },
      { label: "Next new moon", day: ymd(nextNewMoon(now), loc.tz), mins: 300 },
      { label: "1 Jan 2000", day: "2000-01-01", mins: 360 },
    ];
  }, [now, loc.tz]);

  const star = STAR_BY_ID[sel];
  const year = date ? +ymd(date, loc.tz).slice(0, 4) : null;
  const pos = date ? j2000ToHor(star.ra, star.dec, date, loc) : null;
  const clock = `${String(Math.floor((18 * 60 + mins) / 60) % 24).padStart(2, "0")}:${String((18 * 60 + mins) % 60).padStart(2, "0")}`;

  return (
    <section id="any-night" className="relative z-10 mt-36 scroll-mt-24 px-4 sm:px-6 md:mt-52">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading plain="Any night." italic="Any year." />
        <p className="mx-auto mt-6 max-w-[560px] text-center text-[1.05rem] leading-relaxed text-star-2">
          Pick a date from the calendar and Luna rebuilds that sky: the night you were born, next month&rsquo;s meteor shower, a night a thousand years ago.
        </p>

        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <Reveal className="order-2 lg:order-1">
            <div className="flex flex-col gap-4">
              <div className="glass rounded-[28px] p-6 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-[0.85rem] text-star-2"><IconCalendar size={17} /> Date</span>
                    <input type="date" className="field mono w-full text-[0.9rem]" value={day} min="1000-01-01" max="2999-12-31" onChange={(e) => setDay(e.target.value)} />
                  </label>
                  <div className="text-right">
                    <p className="text-[0.78rem] text-star-3">Time at {loc.name}</p>
                    <p className="mono text-[1.6rem] tnum">{clock}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <input type="range" className="scrub" min={0} max={720} step={10} value={mins} onChange={(e) => setMins(+e.target.value)} aria-label="Time of night" />
                  <div className="mono mt-1 flex justify-between text-[0.66rem] text-star-3"><span>18:00</span><span>00:00</span><span>06:00</span></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button key={p.label} onClick={() => { setDay(p.day); setMins(p.mins); }}
                      className={`rounded-lg px-3 py-1.5 text-[0.82rem] transition-colors ${day === p.day && mins === p.mins ? "bg-torch-soft text-torch-ink" : "glass-inset text-star-2 hover:text-star"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-[28px] p-6 sm:p-7">
                <p className="text-[0.85rem] text-star-3">How old is the light?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AGED.map((id) => (
                    <button key={id} onClick={() => setSel(id)}
                      className={`rounded-lg px-3 py-1.5 text-[0.82rem] transition-colors ${sel === id ? "bg-torch-soft text-torch-ink" : "glass-inset text-star-2 hover:text-star"}`}>
                      {STAR_BY_ID[id].name}
                    </button>
                  ))}
                </div>
                {year && star.ly && (
                  <p className="display mt-6 text-[clamp(1.6rem,2.6vw,2.1rem)] leading-[1.15]">
                    Light reaching you from {star.name} that night left it around <em className="text-torch-ink">{yearLabel(Math.round(year - star.ly))}</em>.
                  </p>
                )}
                <dl className="mt-5 grid grid-cols-3 gap-4">
                  <div className="border-t border-line pt-3">
                    <dt className="text-[0.75rem] text-star-3">Distance</dt>
                    <dd className="mono mt-1 text-[0.92rem]">{star.ly?.toLocaleString("en-IN")} ly</dd>
                  </div>
                  <div className="border-t border-line pt-3">
                    <dt className="text-[0.75rem] text-star-3">Star&rsquo;s age</dt>
                    <dd className="mono mt-1 text-[0.92rem]">{star.age?.replace("~", "≈ ")}</dd>
                  </div>
                  <div className="border-t border-line pt-3">
                    <dt className="text-[0.75rem] text-star-3">That night</dt>
                    <dd className="mono mt-1 text-[0.92rem]">{pos ? (pos.alt > 0 ? `${pos.alt.toFixed(0)}° ${compass(pos.az)}` : "Below horizon") : "—"}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[0.72rem] text-star-3">Distances and ages are published estimates; some, like Deneb&rsquo;s, are uncertain.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-[560px]">
              <SkyDial date={date} loc={loc} selected={sel} onSelect={(id) => STAR_BY_ID[id].ly && STAR_BY_ID[id].age ? setSel(id) : undefined} label="Sky chart for the chosen date and time" />
              <p className="mt-3 text-center text-[0.8rem] text-star-3">
                {date ? `${fmtDate(date, loc.tz, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${fmtTime(date, loc.tz)}` : " "}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
