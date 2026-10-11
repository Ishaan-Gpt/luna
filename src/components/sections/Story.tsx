"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useSky } from "@/lib/sky-context";
import { compass, fmtDeg, fmtTime, moonAltAz, moonInfo, overhead, starDay, sunAltAz, twilightName } from "@/lib/sky";
import { STAR_BY_ID } from "@/lib/stars";
import { SkyDial } from "../SkyDial";
import { NightBar } from "../NightBar";
import { SectionHeading } from "../motion-bits";
import { IconClock, IconMoon, IconStar, IconTelescope } from "../icons";

const STEPS = [
  {
    title: "Name what's overhead",
    body: "Hold your phone up. Luna reads the compass and gyroscope, works out where you're pointing, and labels what's there: stars, planets, the Moon and the shapes between them.",
    Icon: IconTelescope,
  },
  {
    title: "Sun and Moon, in degrees",
    body: "Exact height above or below the horizon, which way to face, and when each rises and sets. Twilight is named as it changes, so you know when the sky is truly dark.",
    Icon: IconMoon,
  },
  {
    title: "The best hours, worked out",
    body: "Darkness, moonlight and cloud cover become one window for tonight, and Luna tells you when it opens.",
    Icon: IconClock,
  },
  {
    title: "Mark it. Name it.",
    body: "Star a favourite and Luna keeps track of it: a nudge when it rises, when it's highest, when it's about to set. Give it a nickname if you like.",
    Icon: IconStar,
  },
];

export function Story() {
  const { progress, timeAt, loc, night, marks, nicknames } = useSky();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  const [t, setT] = useState<Date | null>(null);

  useMotionValueEvent(scrollYProgress, "change", (p) => setStep(Math.min(3, Math.floor(p * 4))));
  useMotionValueEvent(progress, "change", (p) => setT(timeAt(p)));
  const date = t ?? timeAt(progress.get());

  const read = useMemo(() => {
    if (!date) return null;
    const sun = sunAltAz(date, loc);
    const moon = moonAltAz(date, loc);
    const star = overhead(date, loc);
    const markId = marks[0] ?? "vega";
    const mark = STAR_BY_ID[markId];
    const day = starDay(mark, new Date(date.getTime() - 12 * 3600000), loc);
    return { sun, moon, star, phase: moonInfo(date), mark, day };
  }, [date, loc, marks]);

  return (
    <section id="story" className="relative z-10 mt-36 md:mt-48">
      <div className="px-4 sm:px-6">
        <SectionHeading plain="One phone." italic="The whole sky, named." />
        <p className="mx-auto mt-6 max-w-[540px] text-center text-[1.05rem] leading-relaxed text-star-2">
          Keep scrolling and the night moves on. The chart below is tonight over {loc.name}, hour by hour.
        </p>
      </div>

      <div ref={ref} className="relative mt-16 md:h-[420vh]">
        <div className="md:sticky md:top-0 md:flex md:h-[100svh] md:items-center">
          <div className="mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
            {/* Steps */}
            <ol className="order-2 flex flex-col gap-2 md:order-1">
              {STEPS.map((s, i) => {
                const active = step === i;
                return (
                  <li key={s.title} className={`rounded-[20px] p-5 transition-all duration-500 ${active ? "glass" : "border border-transparent md:opacity-45"}`}>
                    <div className="flex items-center gap-4">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-500 ${active ? "bg-torch-soft text-torch-ink" : "glass-inset text-star-2"}`}>
                        <s.Icon size={20} active={active} />
                      </span>
                      <h3 className="display text-[1.7rem] leading-tight md:text-[1.9rem]">{s.title}</h3>
                    </div>
                    <div className={`grid transition-[grid-template-rows] duration-500 md:grid-rows-[0fr] ${active ? "md:!grid-rows-[1fr]" : ""}`}>
                      <div className="overflow-hidden">
                        <p className="pt-3 pl-14 text-[0.98rem] leading-relaxed text-star-2">{s.body}</p>
                      </div>
                    </div>
                    {active && (
                      <div className="mt-4 ml-14 hidden h-px overflow-hidden bg-line md:block">
                        <motion.div className="h-full origin-left bg-torch" style={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4 }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Stage */}
            <div className="relative order-1 mx-auto w-full max-w-[560px] md:order-2 md:max-w-[min(540px,calc(100svh-250px))] md:pt-14">
              <SkyDial
                date={date}
                loc={loc}
                overheadId={step === 0 ? read?.star.id : null}
                marks={step === 3 ? marks : []}
                nicknames={nicknames}
                showLabels={step !== 2}
                label="Tonight's sky at the time shown in the navigation bar"
              />
              <div className="mt-3 min-h-[120px] md:-mx-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="glass rounded-[20px] p-5"
                  >
                    {read && step === 0 && (
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[0.82rem] text-star-3">Overhead at {fmtTime(date, loc.tz)}</p>
                          <p className="display text-[2.2rem] leading-none">{read.star.name} <em className="text-[1.2rem] text-star-2">in {read.star.con}</em></p>
                        </div>
                        <p className="mono text-right text-[0.76rem] text-star-2">{read.star.alt.toFixed(1)}° up<br />{compass(read.star.az)}</p>
                      </div>
                    )}
                    {read && step === 1 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[0.82rem] text-star-3">Sun</p>
                          <p className="mono text-[1.4rem] tnum">{fmtDeg(read.sun.alt)}</p>
                          <p className="text-[0.78rem] text-star-3">{twilightName(read.sun.alt)} · rises {fmtTime(night?.sunrise, loc.tz)}</p>
                        </div>
                        <div>
                          <p className="text-[0.82rem] text-star-3">Moon · {Math.round(read.phase.fraction * 100)}% lit</p>
                          <p className="mono text-[1.4rem] tnum">{fmtDeg(read.moon.alt)}</p>
                          <p className="text-[0.78rem] text-star-3">
                            {read.moon.alt > 0 ? `Look ${compass(read.moon.az)}` : "Below the horizon"} · rises {fmtTime(night?.moonrise, loc.tz)}
                          </p>
                        </div>
                      </div>
                    )}
                    {step === 2 && (
                      <div>
                        <p className="mb-7 text-[0.82rem] text-star-3">
                          Tonight: dark from {fmtTime(night?.darkStart, loc.tz)} to {fmtTime(night?.darkEnd, loc.tz)}
                          {night?.best ? `, best ${fmtTime(night.best.start, loc.tz)}–${fmtTime(night.best.end, loc.tz)}` : ""}
                        </p>
                        <NightBar night={night} loc={loc} cursor={date} compact />
                      </div>
                    )}
                    {read && step === 3 && (
                      <div className="flex items-start gap-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-torch-soft text-torch-ink"><IconStar size={20} active /></span>
                        <div>
                          <p className="text-[0.95rem]">
                            <span className="text-torch-ink">{nicknames[read.mark.id] ? `“${nicknames[read.mark.id]}”` : read.mark.name}</span>
                            {nicknames[read.mark.id] ? ` (${read.mark.name})` : ""} is highest at {fmtTime(read.day.transit, loc.tz)}, {read.day.transitAlt.toFixed(0)}° up.
                          </p>
                          <p className="mt-1 text-[0.82rem] text-star-3">
                            {read.day.circumpolar ? "It never sets from here." : read.day.neverRises ? "It never rises from here." : `Rises ${fmtTime(read.day.rise, loc.tz)} · sets ${fmtTime(read.day.set, loc.tz)}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {!read && <div className="skeleton h-16 w-full" />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
