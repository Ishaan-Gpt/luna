"use client";

import { useEffect, useRef, useState } from "react";
import { DUR, fitText, gsap, reduced, setupGsap } from "@/lib/motion";
import { ArrowLeft, ArrowRight } from "./primitives";
import { AnyNightScreen, LockScreen, Phone, PointAskScreen, SkyCheckScreen } from "./Screens";

const FEATURES = [
  {
    title: "Point + ask",
    specs: [["Runs on", "Your phone"], ["Needs signal", "No"]],
    body: "Hold the phone toward the sky and ask what you're looking at. The compass tells Luna where you're pointing; the answer comes back spoken, in fists and directions, on a red screen that keeps your night vision.",
    Screen: PointAskScreen,
  },
  {
    title: "Sky check",
    specs: [["You need", "Your eyes"], ["Adapts to", "Your sky"]],
    body: "Match a constellation to what you actually see. Luna turns your answer into your sky's limiting magnitude and quietly drops everything you couldn't see anyway.",
    Screen: SkyCheckScreen,
  },
  {
    title: "Paper exit",
    specs: [["Unlock needed", "No"], ["Prints", "Your planisphere"]],
    body: "Tonight's three best targets become your lock screen, so you can check the sky without opening anything. Or print a planisphere drawn for your exact latitude and leave the phone indoors.",
    Screen: LockScreen,
  },
  {
    title: "Any night",
    specs: [["Range", "1000 – 2999"], ["Corrected for", "Precession"]],
    body: "Pick any date and see that sky: the night you were born, next month's meteor shower, a night a thousand years ago. The maths is the same, so the answers are too.",
    Screen: AnyNightScreen,
  },
];

export function Features() {
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    setupGsap();
    fitText(root.current!);
  }, []);

  const go = (next: number) => {
    const n = (next + FEATURES.length) % FEATURES.length;
    if (busy.current || n === i) return;
    busy.current = true;
    const el = root.current!;
    const swap = el.querySelectorAll("[data-f-swap]");
    if (reduced()) {
      setI(n);
      setShown(n);
      busy.current = false;
      return;
    }
    gsap.to(swap, {
      opacity: 0, y: -14, duration: DUR.s, ease: "In", stagger: 0.04,
      onComplete: () => {
        setI(n);
        setShown(n);
        requestAnimationFrame(() => {
          fitText(el);
          gsap.fromTo(el.querySelectorAll("[data-f-swap]"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: DUR.m, ease: "Out", stagger: 0.06, onComplete: () => { busy.current = false; } });
        });
      },
    });
  };

  const f = FEATURES[shown];
  const Screen = f.Screen;
  return (
    <section ref={root} data-bg="moon" className="relative overflow-hidden bg-moon pb-[8vh] pt-[18vh] text-ink" aria-roledescription="carousel" aria-label="What Luna does">
      <div className="gut grid grid-cols-12 items-center gap-4 max-lg:grid-cols-1 max-lg:gap-10">
        <dl className="col-span-3 col-start-2 grid gap-8 max-lg:order-2 max-lg:col-span-1 max-lg:col-start-1 max-lg:grid-cols-2" data-reveal="ctn">
          {f.specs.map(([k, v]) => (
            <div key={k} data-f-swap>
              <dt className="t-label text-ink/60">{k}</dt>
              <dd className="t-display mt-2 text-[2.6vw] leading-[0.95] max-lg:text-[7vw]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="col-span-4 col-start-5 mx-auto w-[min(19vw,320px)] max-lg:order-1 max-lg:col-span-1 max-lg:col-start-1 max-lg:w-[62vw]" data-reveal="ctn">
          <div data-f-swap>
            <Phone>
              <Screen />
            </Phone>
          </div>
        </div>
        <div className="col-span-3 col-start-9 max-lg:order-3 max-lg:col-span-1 max-lg:col-start-1" data-reveal="ctn">
          <p data-f-swap className="t-body max-w-[32ch] text-ink/75">{f.body}</p>
          <a href="/sky" className="pill t-label mt-7">Try it tonight</a>
        </div>
      </div>

      <div className="gut relative z-10 -mt-[5vw] flex justify-center max-lg:mt-10">
        <h2 data-f-swap data-fit className="t-display text-[12vw] leading-[0.86]">{f.title}</h2>
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <button onClick={() => go(i - 1)} aria-label="Previous feature" className="p-1 opacity-70 transition-opacity hover:opacity-100"><ArrowLeft /></button>
        {FEATURES.map((x, k) => (
          <button key={x.title} onClick={() => go(k)} aria-label={x.title} aria-current={k === i} className={`t-label tnum transition-opacity ${k === i ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
            {String(k + 1).padStart(2, "0")}
          </button>
        ))}
        <button onClick={() => go(i + 1)} aria-label="Next feature" className="p-1 opacity-70 transition-opacity hover:opacity-100"><ArrowRight /></button>
      </div>
    </section>
  );
}
