"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { fmtTime, HANLE, tonight, type Night } from "@/lib/sky";
import { scrollToTarget } from "./LunaMotion";
import { ArrowUp, Mark, VineB } from "./primitives";

const CREDITS: [string, string, string][] = [
  ["Gemma 4", "Apache 2.0", "https://ai.google.dev/gemma"],
  ["Astronomy Engine", "MIT", "https://github.com/cosinekitty/astronomy"],
  ["Open-Meteo", "CC BY 4.0", "https://open-meteo.com"],
  ["Made in 2026", "Hacktoberfest", "https://dev.to/challenges/hacktoberfest-week1-2026-10-05"],
];

const GET: [string, string, string][] = [
  ["Android", "Download the app", "/get"],
  ["iPhone", "Add it from Safari", "/get"],
  ["Browser", "Open Luna now", "/sky"],
];

/** The open pieces Luna stands on, with their real licences. */
export function Credits() {
  return (
    <section data-bg="light" className="relative overflow-hidden bg-paper pb-[18vh] pt-[16vh] text-ink">
      <div data-drift="-50" className="pointer-events-none absolute -right-[8vw] top-[10vh] w-[30vw] max-lg:w-[58vw]">
        <VineB className="h-auto w-full" />
      </div>
      <div className="gut relative flex flex-col items-center text-center" data-reveal-group>
        <p data-reveal="ctn" className="t-label max-w-[30ch]">A night to come back to, night after night</p>
        <span data-reveal="line" className="vline mt-6 block h-[14vh]" />
        <ul className="mt-[8vh] grid gap-[1.2vw]">
          {CREDITS.map(([name, lic, href]) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer" data-reveal="h" className="t-display t-h4 transition-opacity hover:opacity-60 max-lg:!text-[11vw]">
                {name}
                <sup className="lic">{lic}</sup>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  const [night, setNight] = useState<Night | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setNight(tonight(new Date(), HANLE)), 0);
    return () => clearTimeout(t);
  }, []);

  const darkWindow = night?.darkStart && night.darkEnd ? `${fmtTime(night.darkStart, HANLE.tz)}—${fmtTime(night.darkEnd, HANLE.tz)}` : "--:--—--:--";

  return (
    <footer id="get">
      {/* call to action over first light */}
      <div data-bg="dark" className="relative h-[80vh] overflow-hidden bg-night text-star" data-parallax="w">
        <img src="/art/dawn-ridge.webp" alt="First light over the ridges, one bright planet still up" data-parallax="img" data-amount="8" className="absolute inset-0 h-[116%] w-full -translate-y-[7%] object-cover" />
        <div className="absolute inset-0 grid place-items-center text-center" data-reveal-group>
          <div>
            <p data-reveal="a" className="t-script text-[9vw] max-lg:text-[18vw]">see you tonight</p>
            <a href="/get" className="t-label ulink mt-4 inline-block">Get Luna on your phone</a>
          </div>
        </div>
      </div>

      <div data-bg="ember" className="relative bg-ember pb-10 pt-[14vh] text-star">
        <div className="gut flex flex-col items-center text-center" data-reveal-group>
          <span data-reveal="ctn"><Mark size={46} /></span>
          <p data-reveal="h" className="t-display tnum mt-[6vh] text-[11vw] leading-[0.82] max-lg:text-[17vw]">{darkWindow}</p>
          <p data-reveal="ctn" className="t-label mt-6 text-star/65">Tonight&rsquo;s truly dark hours · Hanle, Ladakh</p>

          <div className="mt-[9vh] grid w-full max-w-[860px] gap-px overflow-hidden rounded-[22px] border border-star/15 bg-star/15 sm:grid-cols-3" data-reveal="ctn">
            {GET.map(([k, v, href]) => (
              <a key={k} href={href} className="group flex flex-col items-center gap-2 bg-ember px-6 py-8 transition-colors hover:bg-[#3a1419]">
                <span className="t-display t-h6 max-lg:!text-[8vw]">{k}</span>
                <span className="t-label text-star/60 group-hover:text-star">{v}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="gut mt-[12vh] flex flex-wrap items-end justify-between gap-6 border-t border-star/15 pt-6">
          <button onClick={() => scrollToTarget(0)} className="t-label flex items-center gap-3 opacity-80 hover:opacity-100">
            <ArrowUp size={16} /> To the top
          </button>
          <p className="t-label text-center text-star/55">Your location never leaves your phone</p>
          <p className="t-label text-right text-star/55">Luna © 2026 · Made for dark places</p>
        </div>
      </div>
    </footer>
  );
}
