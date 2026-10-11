"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSky } from "@/lib/sky-context";
import { compass, eqToHor, fmtTime, lst, placeStars, starDay } from "@/lib/sky";
import { STAR_BY_ID } from "@/lib/stars";
import { SkyDial } from "../SkyDial";
import { LogoMark } from "../Logo";
import { Reveal, SectionHeading } from "../motion-bits";
import { IconBell, IconQuill, IconStar } from "../icons";

export function Yours() {
  const { now, loc, marks, toggleMark, nicknames, setNickname } = useSky();
  const [sel, setSel] = useState("vega");
  const picked = useRef(false);

  // Start on a star that is actually up: Vega if it is, otherwise the brightest one well above the horizon.
  useEffect(() => {
    if (!now || picked.current) return;
    picked.current = true;
    const up = placeStars(now, loc).filter((s) => s.alt > 15).sort((a, b) => a.mag - b.mag);
    const vega = up.find((s) => s.id === "vega");
    const first = vega ?? up[0];
    if (first) setTimeout(() => setSel(first.id), 0);
  }, [now, loc]);
  const star = STAR_BY_ID[sel];
  const marked = marks.includes(sel);
  const nick = nicknames[sel] ?? "";

  const info = useMemo(() => {
    if (!now) return null;
    const pos = eqToHor(star.ra, star.dec, loc.lat, lst(now, loc.lon));
    const day = starDay(star, now, loc);
    return { pos, day };
  }, [now, loc, star]);

  const callName = nick ? `“${nick}”` : star.name;
  const note = !info
    ? ""
    : info.day.neverRises
      ? `${callName} never rises from ${loc.name}. Luna can show you where to see it.`
      : info.pos.alt > 0
        ? `${callName}${nick ? ` (${star.name})` : ""} is up now, ${info.pos.alt.toFixed(0)}° high in the ${compass(info.pos.az)}. Highest at ${fmtTime(info.day.transit, loc.tz)}.`
        : `${callName}${nick ? ` (${star.name})` : ""} rises at ${fmtTime(info.day.rise, loc.tz)} in the ${compass(eqToHor(star.ra, star.dec, loc.lat, lst(info.day.rise ?? now ?? new Date(), loc.lon)).az)}.`;

  return (
    <section id="yours" className="relative z-10 mt-36 scroll-mt-24 px-4 sm:px-6 md:mt-52">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading plain="Mark a star." italic="Call it anything." />
        <p className="mx-auto mt-6 max-w-[560px] text-center text-[1.05rem] leading-relaxed text-star-2">
          Tap any star on the chart. Mark it, give it a name that means something to you, and Luna will tell you when it&rsquo;s up.
        </p>

        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <Reveal>
            <div className="mx-auto w-full max-w-[560px]">
              <SkyDial date={now} loc={loc} selected={sel} onSelect={setSel} marks={marks} nicknames={nicknames} label="Interactive sky chart. Select a star to mark or nickname it." />
              <p className="mt-3 text-center text-[0.8rem] text-star-3">Live sky over {loc.name}. Tap a star.</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-4">
              <div className="glass rounded-[28px] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.85rem] text-star-3">{star.con} · magnitude {star.mag.toFixed(2)}</p>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={sel}
                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35 }}
                        className="display mt-1 truncate text-[clamp(2.2rem,4vw,3rem)] leading-none"
                      >
                        {nick ? <><em className="text-torch-ink">{nick}</em> <span className="text-[0.55em] text-star-2">{star.name}</span></> : star.name}
                      </motion.h3>
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => toggleMark(sel)}
                    aria-pressed={marked}
                    className={`flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-[0.9rem] transition-colors ${marked ? "bg-torch text-[#160807]" : "btn-ghost !h-11"}`}
                  >
                    <motion.span key={String(marked)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 18 }}>
                      <IconStar size={18} active={marked} />
                    </motion.span>
                    {marked ? "Marked" : "Mark"}
                  </button>
                </div>

                <label className="mt-6 block">
                  <span className="mb-2 flex items-center gap-2 text-[0.85rem] text-star-2"><IconQuill size={17} /> Nickname</span>
                  <input
                    className="field w-full"
                    value={nick}
                    maxLength={28}
                    placeholder={`e.g. "Lantern"`}
                    onChange={(e) => setNickname(sel, e.target.value)}
                  />
                </label>
                <p className="mt-3 text-[0.78rem] leading-snug text-star-3">
                  Nicknames are just for you and stay on your device. A star&rsquo;s official name never changes, and nobody can sell you one.
                </p>
              </div>

              {/* Notification preview */}
              <div className="glass-strong rounded-[22px] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-night ring-1 ring-line"><LogoMark size={24} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between text-[0.8rem]">
                      <span className="font-semibold">Luna</span>
                      <span className="text-star-3">now</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[0.8rem] text-star-3"><IconBell size={14} /> Your marked stars</p>
                  </div>
                </div>
                <p className="mt-3 text-[0.94rem] leading-snug">{note || <span className="skeleton inline-block h-4 w-3/4" />}</p>
              </div>
              <p className="text-center text-[0.75rem] text-star-3">A preview of the alert you&rsquo;d get, worked out for {loc.name}.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
