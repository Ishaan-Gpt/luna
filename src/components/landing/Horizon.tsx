"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react";
import { BP, gsap, initReveals, reduced, ScrollTrigger, setupGsap } from "@/lib/motion";
import { distanceKm } from "@/lib/sky";
import { PLACES } from "@/lib/stars";
import { CircleButton, Mark } from "./primitives";

const ORIGIN = { name: "A Delhi terrace", note: "Bortle 8", lat: 28.61, lon: 77.21 };
const STOPS = ["spiti", "hanle", "rann"]
  .map((id) => PLACES.find((p) => p.id === id)!)
  .map((p) => ({ ...p, km: Math.round(distanceKm(ORIGIN, p) / 10) * 10 }))
  .sort((a, b) => a.km - b.km);

// x positions (in % of the route width) and the wave the line follows
const XS = [6, 33, 61, 88];
const WAVE = "M0 70 C 60 70 70 40 120 42 S 200 92 260 80 S 330 30 390 44 S 470 96 540 78 S 620 34 680 48 S 760 88 800 70";

/**
 * Pinned and scrolled sideways, like a drive out of town: the city on the left, darker places
 * along a hand-drawn line that draws itself as you go. Distances are straight-line, computed live.
 */
export function Horizon() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setupGsap();
    const el = ref.current!;
    const track = el.querySelector<HTMLElement>("[data-horizontal]")!;
    const path = el.querySelector<SVGPathElement>("[data-route]");
    if (reduced() || window.innerWidth < BP) return initReveals(el);
    const dist = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: { trigger: el, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    const undoReveals = initReveals(el, tween);
    if (path) {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path, containerAnimation: tween, start: "left 90%", end: "right 60%", scrub: true } });
    }
    return () => {
      undoReveals();
      tween.scrollTrigger?.kill();
      tween.kill();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section ref={ref} data-bg="light" className="relative overflow-hidden bg-paper text-ink">
      <div data-horizontal className="flex h-[100svh] w-max items-stretch max-lg:h-auto max-lg:w-full max-lg:flex-col">
        {/* Panel 1: the picture, the button, the line between city and dark */}
        <div className="relative flex h-full w-[100vw] shrink-0 max-lg:h-auto max-lg:flex-col">
          <div className="relative h-full w-[30vw] overflow-hidden bg-ink max-lg:h-[60vh] max-lg:w-full">
            <img src="/art/lake-dusk.webp" alt="Dusk over a still lake, a thin crescent moon above the ridge" className="absolute inset-0 h-full w-full object-cover object-[70%_50%]" />
          </div>
          <div className="relative flex flex-1 flex-col justify-between px-[4vw] py-[14vh] max-lg:gap-10 max-lg:px-6 max-lg:py-14" data-reveal-group>
            <div className="self-start" data-reveal="ctn">
              <CircleButton href="#places" size={150}>Find darker sky</CircleButton>
            </div>
            <div className="max-w-[30vw] max-lg:max-w-none">
              <h2 data-reveal="h" className="t-display t-h5">Between the city and the dark</h2>
              <p data-reveal="p" className="t-body mt-5 max-w-[38ch] text-ink/70">
                The darkest skies are often one long drive away. Luna keeps a list of places where the night is properly dark, tells you how far each one is and which way to face when you get there, and works once you arrive with no signal at all.
              </p>
            </div>
          </div>
        </div>

        {/* Panel 2: the sky you wanted, and the road to it */}
        <div id="places" className="relative flex h-full w-[140vw] shrink-0 flex-col justify-between pb-[12vh] pt-[16vh] max-lg:h-auto max-lg:w-full max-lg:gap-12 max-lg:py-16">
          <div className="flex flex-col items-center text-center" data-reveal-group>
            <h2 className="t-display text-[7vw] leading-[0.86] max-lg:text-[15vw]">
              <span data-reveal="h" className="block">The sky you wanted</span>
              <span data-reveal="a" className="t-script relative z-10 -my-[2vw] block text-[8vw] normal-case max-lg:text-[16vw]">yours</span>
              <span data-reveal="h" className="block">tonight</span>
            </h2>
          </div>

          {/* desktop route */}
          <div className="relative mx-[6vw] h-[22vh] max-lg:hidden">
            <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[10vh] w-full overflow-visible" aria-hidden>
              <path data-route d={WAVE} fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            </svg>
            {[{ name: ORIGIN.name, sub: ORIGIN.note, km: 0 }, ...STOPS.map((s) => ({ name: `${s.name.split(" ")[0]}, ${s.region.split(",")[0]}`, sub: `${s.km.toLocaleString("en-IN")} km`, km: s.km }))].map((s, k) => (
              <div key={s.name} className="absolute bottom-[5vh] flex -translate-x-1/2 flex-col items-center gap-2 text-center" style={{ left: `${XS[k]}%` }} data-reveal-group>
                <span data-reveal="ctn" className="t-label max-w-[16ch]">{s.name}</span>
                <span data-reveal="ctn" className="t-label text-ink/55">{s.sub}</span>
                <span className="mt-2 block h-2 w-2 rounded-full bg-ink" />
              </div>
            ))}
            <span className="absolute -bottom-[1vh] right-0 translate-x-1/2"><Mark size={28} /></span>
          </div>

          {/* mobile list */}
          <ol className="gut grid gap-5 lg:hidden">
            {[{ name: ORIGIN.name, sub: ORIGIN.note }, ...STOPS.map((s) => ({ name: `${s.name}`, sub: `${s.km.toLocaleString("en-IN")} km · ${s.region}` }))].map((s) => (
              <li key={s.name} className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
                <span className="t-display text-[7vw]">{s.name}</span>
                <span className="t-label text-right text-ink/60">{s.sub}</span>
              </li>
            ))}
          </ol>
          <p className="t-label gut text-ink/50 lg:pl-[6vw]">Straight-line distance from Delhi. Luna measures from wherever you are standing.</p>
        </div>
      </div>
    </section>
  );
}
