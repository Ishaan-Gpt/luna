"use client";

import { useEffect, useRef, useState } from "react";
import { BP, gsap, reduced, revealA, revealCtn, revealH, revealP, ScrollTrigger, setupGsap } from "@/lib/motion";
import type { SkyMode } from "@/lib/panorama";
import { Ridge } from "../Ridge";
import { HeroSky } from "./HeroSky";
import { CircleButton } from "./primitives";

/**
 * The sky over Hanle tonight, with the name standing in it. BY CITY / BY DARK swaps the same sky
 * between an orange city glow and a dark site. On scroll, the words lift away faster than the sky,
 * then the sky dives toward the horizon.
 */
export function Hero() {
  const [mode, setMode] = useState<SkyMode>("dark");
  const area = useRef<HTMLElement>(null);

  useEffect(() => {
    setupGsap();
    const el = area.current!;
    const title = el.querySelectorAll<HTMLElement>("[data-hero='h']");
    const script = el.querySelectorAll<HTMLElement>("[data-hero='a']");
    const row = el.querySelectorAll<HTMLElement>("[data-hero='p']");
    const ctn = el.querySelectorAll<HTMLElement>("[data-hero='ctn']");
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      gsap.set([...title, ...script, ...row, ...ctn], { visibility: "visible" });
      if (reduced()) return;
      revealH([...title], "reveal", 0);
      revealA([...script], "reveal", 0.45);
      revealP([...row], "reveal", 0.7);
      revealCtn([...ctn], "reveal", 0.9);
    };
    if (!reduced()) {
      revealH([...title], "initial");
      revealA([...script], "initial");
      revealP([...row], "initial");
      revealCtn([...ctn], "initial");
    }
    const intro = document.documentElement.dataset.intro;
    if (intro === "none" || !intro) show();
    window.addEventListener("luna:intro-reveal", show);
    window.addEventListener("luna:intro-done", show);

    // Scroll: words rise faster than the sky, then the sky dives in.
    let tl: gsap.core.Timeline | null = null;
    if (!reduced()) {
      const words = el.querySelector("[data-hero-words]");
      const sky = el.querySelector("[data-hero-sky-move]");
      const desk = window.innerWidth >= BP;
      tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true } });
      tl.to(words, { yPercent: desk ? -90 : -60, ease: "Ease", duration: 0.6 }, 0)
        .to(el.querySelectorAll("[data-hero-fade]"), { opacity: 0, ease: "none", duration: 0.2 }, 0.05)
        .to(sky, { yPercent: -8, ease: "Ease", duration: 0.6 }, 0)
        .to(sky, { scale: 2, ease: "In", duration: 0.6, transformOrigin: "50% 75%" }, 0.4)
        .to(el.querySelector("[data-hero-ridge]"), { yPercent: 60, ease: "In", duration: 0.6 }, 0.4);
    }
    return () => {
      window.removeEventListener("luna:intro-reveal", show);
      window.removeEventListener("luna:intro-done", show);
      tl?.scrollTrigger?.kill();
      tl?.kill();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section id="top" ref={area} data-bg="dark" className="relative h-[300vh] bg-night text-star max-lg:h-[220vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div data-hero-sky className="absolute inset-0">
          <div data-hero-sky-move className="absolute inset-0 will-change-transform">
            <HeroSky mode={mode} />
          </div>
          <div data-hero-ridge className="absolute inset-x-0 bottom-0 h-[34vh] max-lg:h-[24vh]">
            <Ridge className="h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
        </div>

        <div data-hero-words className="relative h-full will-change-transform">
          {/* the name */}
          <div className="absolute inset-x-0 top-[6vh] flex flex-col items-center max-lg:top-[16vh]">
            <h1 data-hero="h" className="t-display text-[29vw] leading-[0.8] max-lg:text-[40vw]">Luna</h1>
            <p data-hero="a" className="t-script -mt-[7.6vw] ml-[14vw] -rotate-[5deg] text-[9.6vw] max-lg:-mt-[11vw] max-lg:text-[16vw]">after dark</p>
          </div>

          {/* the split line with the city/dark switch */}
          <div className="absolute inset-x-0 top-[61vh] grid grid-cols-[1fr_auto_1fr] items-center gap-[3vw] px-[16vw] max-lg:top-[60vh] max-lg:grid-cols-1 max-lg:justify-items-center max-lg:gap-5 max-lg:px-6">
            <p data-hero="p" className="t-display t-h6 justify-self-start max-lg:justify-self-center">The sky</p>
            <div data-hero="ctn" className="flex items-center gap-4" role="group" aria-label="Show the sky from">
              <button onClick={() => setMode("city")} aria-pressed={mode === "city"} className={`t-label transition-opacity duration-500 ${mode === "city" ? "opacity-100" : "opacity-45 hover:opacity-80"}`}>By city</button>
              <span className="relative h-px w-[clamp(54px,6vw,110px)] bg-star/30">
                <span className="absolute inset-y-0 w-1/2 bg-star transition-transform duration-700" style={{ transform: mode === "city" ? "translateX(0)" : "translateX(100%)", transitionTimingFunction: "var(--ease-inout)" }} />
              </span>
              <button onClick={() => setMode("dark")} aria-pressed={mode === "dark"} className={`t-label transition-opacity duration-500 ${mode === "dark" ? "opacity-100" : "opacity-45 hover:opacity-80"}`}>By dark</button>
            </div>
            <p data-hero="p" className="t-display t-h6 justify-self-end max-lg:justify-self-center">is still there</p>
          </div>

          {/* call to action and the honest caption */}
          <div data-hero="ctn" data-hero-fade className="absolute bottom-[5vh] left-1/2 -translate-x-1/2">
            <CircleButton href="/get" tone="star" size={150}>Get Luna tonight</CircleButton>
          </div>
          <p data-hero="ctn" data-hero-fade className="t-label absolute bottom-[6vh] left-[calc(var(--gutter)+120px)] max-w-[22ch] text-star/60 max-lg:hidden">
            {mode === "dark" ? "Real sky · tonight 20:30 · Hanle · facing southwest" : "Same sky · same minute · under city lights"}
          </p>
          <p data-hero="ctn" data-hero-fade className="t-label absolute bottom-[6vh] right-[var(--gutter)] text-right text-star/60 max-lg:hidden">32.8°N · 78.9°E</p>
        </div>
      </div>
    </section>
  );
}
