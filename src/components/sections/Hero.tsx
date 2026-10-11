"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useMemo, useRef } from "react";
import { useSky } from "@/lib/sky-context";
import { compass, fmtDeg, fmtLat, fmtLon, fmtTime, moonAltAz, moonInfo, overhead, sunAltAz, twilightName } from "@/lib/sky";
import { SkyDial } from "../SkyDial";
import { Ridge } from "../Ridge";
import { Magnetic } from "../motion-bits";
import { IconArrowDown, IconLocate, IconMoon, IconStar, IconSun } from "../icons";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const { now, loc, night, locateMe, resetLocation, geo, marks, nicknames } = useSky();
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: panel, offset: ["start end", "end start"] });
  const ridgeY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const info = useMemo(() => {
    if (!now) return null;
    const star = overhead(now, loc);
    const sun = sunAltAz(now, loc);
    const moon = moonAltAz(now, loc);
    return { star, sun, moon, phase: moonInfo(now) };
  }, [now, loc]);

  const rise = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 22, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 1, delay: d, ease } });

  return (
    <section id="top" className="relative z-10 px-4 pt-32 sm:px-6 md:pt-40">
      <div className="mx-auto max-w-[1180px] text-center">
        <motion.h1 {...rise(0.1)} className="display text-[clamp(3rem,8vw,7.6rem)]">
          <span className="block">Look up.</span>
          <em className="block">Luna knows who&rsquo;s there.</em>
        </motion.h1>
        <motion.p {...rise(0.25)} className="mx-auto mt-7 max-w-[580px] text-[1.08rem] leading-relaxed text-star-2 md:text-[1.15rem]">
          Point your phone at the night and Luna names every star, planet and constellation in view. It runs on GPS, compass and an onboard sky, so it keeps working where the signal stops and the sky gets good.
        </motion.p>
        <motion.div {...rise(0.4)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <a href="#waitlist" className="btn-torch">Join the waitlist</a>
          </Magnetic>
          <a href="#story" className="btn-ghost">
            See how it reads the sky <IconArrowDown size={18} />
          </a>
        </motion.div>
      </div>

      {/* The live instrument, over a Ladakh ridgeline */}
      <motion.div
        ref={panel}
        {...(reduce ? {} : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.2, delay: 0.55, ease } })}
        className="relative mx-auto mt-16 max-w-[1240px] overflow-hidden rounded-[32px] border border-line md:mt-20"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/55" />
        <motion.div style={{ y: reduce ? 0 : ridgeY }} className="absolute inset-x-0 bottom-0 h-[46%]">
          <Ridge className="h-full w-full" />
        </motion.div>

        <div className="relative grid grid-cols-1 items-center gap-8 p-4 sm:p-8 md:grid-cols-[1.15fr_1fr] md:gap-10 md:p-12">
          <div className="mx-auto w-full min-w-0 max-w-[520px]">
            <SkyDial date={now} loc={loc} overheadId={info?.star.id} marks={marks} nicknames={nicknames} label="Live sky over the chosen location, right now" />
          </div>

          <div className="flex min-w-0 flex-col gap-3 text-left">
            <div className="glass rounded-[22px] p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[0.85rem] text-star-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-torch opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-torch" />
                  </span>
                  Live over {loc.name}
                </p>
                <p className="mono text-[0.72rem] text-star-3">{fmtLat(loc.lat)} {fmtLon(loc.lon)}</p>
              </div>
              <div className="mt-5 flex items-end gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl glass-inset text-torch-ink">
                  <IconStar size={24} active />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.85rem] text-star-3">Closest to straight up</p>
                  {info ? (
                    <p className="display truncate text-[2.4rem] leading-none">
                      {info.star.name} <em className="text-[1.4rem] text-star-2">in {info.star.con}</em>
                    </p>
                  ) : (
                    <div className="skeleton mt-2 h-9 w-48" />
                  )}
                </div>
              </div>
              <p className="mono mt-3 text-[0.76rem] text-star-2">
                {info ? `${info.star.alt.toFixed(1)}° up · ${compass(info.star.az)} · mag ${info.star.mag.toFixed(2)}` : " "}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-[20px] p-4">
                <p className="flex items-center gap-2 text-[0.82rem] text-star-3"><IconSun size={17} /> Sun</p>
                <p className="mono mt-2 text-[1.35rem] text-star tnum">{info ? fmtDeg(info.sun.alt) : "—"}</p>
                <p className="mt-1 text-[0.78rem] text-star-3">{info ? twilightName(info.sun.alt) : " "}</p>
              </div>
              <div className="glass rounded-[20px] p-4">
                <p className="flex items-center gap-2 text-[0.82rem] text-star-3"><IconMoon size={17} /> Moon</p>
                <p className="mono mt-2 text-[1.35rem] text-star tnum">{info ? fmtDeg(info.moon.alt) : "—"}</p>
                <p className="mt-1 text-[0.78rem] text-star-3">{info ? `${Math.round(info.phase.fraction * 100)}% · ${info.phase.name}` : " "}</p>
              </div>
            </div>

            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[20px] p-4">
              <p className="text-[0.85rem] text-star-2">
                Sunset {fmtTime(night?.sunset, loc.tz)} · Sunrise {fmtTime(night?.sunrise, loc.tz)}
              </p>
              {loc.own ? (
                <button onClick={resetLocation} className="text-[0.85rem] text-torch-ink underline-offset-4 hover:underline">
                  Back to Hanle
                </button>
              ) : (
                <button onClick={locateMe} disabled={geo === "asking"} className="flex items-center gap-2 rounded-lg px-2 py-1 text-[0.85rem] text-torch-ink hover:bg-torch-soft disabled:opacity-60">
                  <IconLocate size={17} className={geo === "asking" ? "animate-[spin-slow_1.6s_linear_infinite]" : ""} />
                  {geo === "asking" ? "Finding you…" : geo === "denied" ? "Location blocked, staying in Hanle" : "Use my location"}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <p className="mx-auto mt-4 max-w-[1240px] px-2 text-center text-[0.8rem] text-star-3">
        This chart is computed in your browser, the same way the app will do it on your phone. Tap &ldquo;Use my location&rdquo; to see your own sky. Your location stays on your device.
      </p>
    </section>
  );
}
