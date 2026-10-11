"use client";

import { useEffect, useRef } from "react";
import { gsap, reduced, setupGsap } from "@/lib/motion";
import { Mark } from "./primitives";

const R = 468;
const pt = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(500 + R * Math.cos(a)).toFixed(1)} ${(500 + R * Math.sin(a)).toFixed(1)}`;
};

/**
 * The Moon comes up over the hero: a pale disc wider than the screen, the words riding its rim.
 * Scrolling lifts it into place and spreads the words apart.
 */
export function Moonrise() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    setupGsap();
    if (reduced()) return;
    const el = ref.current!;
    const disc = el.querySelector("[data-disc]");
    const words = el.querySelector<SVGTextElement>("[data-arc-text]");
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top bottom", end: "top 10%", scrub: 0.6 } });
    tl.fromTo(disc, { yPercent: 18 }, { yPercent: 0, ease: "none" }, 0);
    const spread = gsap.fromTo(words, { attr: { "word-spacing": 0 } }, { attr: { "word-spacing": 34 }, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      spread.scrollTrigger?.kill();
      spread.kill();
    };
  }, []);

  return (
    <section ref={ref} data-bg="moon" className="relative z-10 -mt-[78vh] h-[78vh] overflow-hidden max-lg:-mt-[60vh] max-lg:h-[60vh]" aria-label="Three reasons to look up">
      <div data-disc className="absolute left-1/2 top-[6vh] aspect-square w-[170vw] -translate-x-1/2 rounded-full bg-moon text-ink max-lg:w-[260vw]">
        <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <path id="moon-rim" d={`M${pt(-148)} A${R} ${R} 0 0 1 ${pt(-32)}`} />
          </defs>
          <text data-arc-text fontSize="12.5" fill="currentColor" style={{ fontFamily: "var(--serif)", fontVariationSettings: '"wdth" 62.5', textTransform: "uppercase", letterSpacing: "0.02em" }}>
            <textPath href="#moon-rim" startOffset="50%" textAnchor="middle">Three reasons to look up</textPath>
          </text>
        </svg>
        <div className="absolute left-1/2 top-[4.6%] flex -translate-x-1/2 items-center gap-[2vw] max-lg:top-[5.5%]">
          <span className="t-label">Look</span>
          <Mark size={30} />
          <span className="t-label">Up</span>
        </div>
        <span data-reveal="line" className="vline absolute left-1/2 top-[7.6%] h-[18vh] -translate-x-1/2 max-lg:top-[8.6%]" />
      </div>
    </section>
  );
}
