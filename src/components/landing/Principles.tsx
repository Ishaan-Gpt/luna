"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { BP, gsap, reduced, ScrollTrigger, setupGsap } from "@/lib/motion";
import { Mark, VineA } from "./primitives";

const ITEMS = ["Open weights", "Runs on your phone", "No account", "No tracking", "Red-light screen", "Any date, any year"];

/**
 * Why it's open, then six plain promises over a lake going from dusk to night.
 * The list follows the scroll; at the end a pale moon rises into the next chapter.
 */
export function Principles() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setupGsap();
    const el = ref.current!;
    const stage = el.querySelector("[data-p-stage]");
    if (reduced() || window.innerWidth < BP) {
      setTimeout(() => setActive(ITEMS.length - 1), 0);
      return;
    }
    const night = el.querySelector("[data-p-night]");
    const moon = el.querySelector("[data-p-moon]");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (s) => setActive(Math.min(ITEMS.length - 1, Math.floor(s.progress * 1.18 * ITEMS.length))),
      },
    });
    tl.fromTo(night, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.7 }, 0.05)
      .fromTo(el.querySelector("[data-p-img]"), { scale: 1.08 }, { scale: 1, ease: "none", duration: 1 }, 0)
      .fromTo(moon, { yPercent: 100 }, { yPercent: 0, ease: "Ease", duration: 0.22 }, 0.78);
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section id="open" ref={ref} className="relative">
      {/* the reason, said once */}
      <div data-bg="light" className="relative overflow-hidden bg-paper pb-[16vh] pt-[20vh] text-ink">
        <div data-drift="60" className="pointer-events-none absolute -left-[7vw] top-[22vh] w-[28vw] max-lg:top-[4vh] max-lg:w-[56vw]">
          <VineA className="h-auto w-full" />
        </div>
        <div className="gut relative mx-auto flex max-w-[74vw] flex-col items-center text-center max-lg:max-w-none" data-reveal-group>
          <h2 data-reveal="h" className="t-display t-statement">
            The best skies have no signal. So the model lives on your phone, and every answer is checked against the sky itself
          </h2>
          <p data-reveal="p" className="t-body mt-[6vh] max-w-[40ch] text-ink/70">
            Luna runs Gemma, Google&rsquo;s open-weight model, inside your browser. It never states a star&rsquo;s position from memory: it asks Luna&rsquo;s astronomy engine, and a checker compares every name, direction and time in its answer before you hear it. Your location never leaves the phone, and a question costs nothing.
          </p>
          <span data-reveal="ctn" className="mt-[7vh] block"><Mark size={32} /></span>
        </div>
      </div>

      {/* the promises, over a lake going dark */}
      <div data-p-stage data-bg="dark" className="relative h-[320vh] bg-night text-star max-lg:h-auto">
        <div className="sticky top-0 h-[100svh] overflow-hidden max-lg:relative max-lg:h-[110svh]">
          <div data-p-img className="absolute inset-0">
            <img src="/art/lake-dusk.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <img data-p-night src="/art/lake-night.webp" alt="A still lake under the Milky Way and a crescent moon" className="absolute inset-0 h-full w-full object-cover max-lg:opacity-100" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/35" />

          <ul className="absolute right-[var(--gutter)] top-[22vh] flex flex-col items-end gap-[0.6vw] text-right max-lg:left-6 max-lg:right-6 max-lg:top-[16vh] max-lg:items-start max-lg:text-left">
            {ITEMS.map((t, k) => (
              <li key={t} className={`t-display t-h5 transition-opacity duration-700 max-lg:!text-[9vw] ${k <= active ? "opacity-100" : "opacity-30"}`}>
                {t}
              </li>
            ))}
          </ul>

          <div className="absolute bottom-[10vh] left-[calc(var(--gutter)+130px)] max-w-[34ch] max-lg:bottom-[8vh] max-lg:left-6 max-lg:right-6">
            <p className="t-label mb-3 text-star/70">Why open</p>
            <p className="t-body text-star/85">
              A closed model lives on someone else&rsquo;s server, and that server is out of reach at 4,500 metres. Open weights let Luna travel with you, keep your location to itself, and swap in a smaller model on an older phone.
            </p>
          </div>

          <div data-p-moon className="absolute top-[68%] left-1/2 aspect-square w-[170vw] -translate-x-1/2 rounded-full bg-paper max-lg:hidden" />
        </div>
      </div>
    </section>
  );
}
