"use client";

import { useEffect, useRef, useState } from "react";
import { DUR, gsap, revealH, revealP, setupGsap } from "@/lib/motion";

/**
 * Moonrise. The moon fills from crescent to full while the page loads, then a round window
 * rises from below the horizon and opens the page through it.
 * Long version on the first visit of a session, short on repeats, none with reduced motion.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    setupGsap();
    const el = root.current!;
    const html = document.documentElement;
    const mode = html.dataset.intro;
    const done = () => {
      try {
        sessionStorage.setItem("luna-intro", "1");
      } catch {}
      html.classList.remove("locked");
      window.dispatchEvent(new Event("luna:intro-done"));
      setGone(true);
    };
    if (mode === "none" || !mode) {
      window.dispatchEvent(new Event("luna:intro-done"));
      setTimeout(() => setGone(true), 0);
      return;
    }
    window.scrollTo(0, 0);
    html.classList.add("locked");
    const sky = document.querySelector<HTMLElement>("[data-hero-sky]");
    const desk = window.innerWidth >= 992;
    const r0 = desk ? "9vw" : "20vw";
    const r1 = desk ? "17vw" : "34vw";

    const tl = gsap.timeline({ onComplete: done });
    tl.set(el, { "--r": r0, "--y": "118vh" });
    if (sky) tl.set(sky, { scale: desk ? 0.82 : 1.12, transformOrigin: "50% 60%" }, 0);

    if (mode === "long") {
      const title = el.querySelectorAll<HTMLElement>("[data-pre='h']");
      const lines = el.querySelectorAll<HTMLElement>("[data-pre='p']");
      gsap.set([...title, ...lines], { visibility: "visible" });
      tl.add(() => {
        revealH([...title], "reveal", 0.1);
        revealP([...lines], "reveal", 0.35);
      }, 0)
        .fromTo(el.querySelector("[data-pre='shade']"), { xPercent: 0 }, { xPercent: 102, duration: 2.1, ease: "InOut" }, 0.35)
        .to(el.querySelector("[data-pre='ctn']"), { opacity: 0, duration: DUR.s, ease: "In" }, 2.55);
    } else {
      tl.set(el.querySelector("[data-pre='ctn']"), { display: "none" });
    }

    tl.to(el, { "--y": "52vh", "--r": r1, duration: DUR.l * 1.25, ease: "InOut" }, mode === "long" ? 2.5 : 0.1)
      .to(el, { "--r": "160vmax", duration: DUR.l * 2, ease: "diveIn" }, "<90%")
      .add(() => window.dispatchEvent(new Event("luna:intro-reveal")), "<10%");
    if (sky) tl.to(sky, { scale: 1, duration: DUR.l * 1.6, ease: "InOut" }, "<");
    tl.set(el, { display: "none" });
    return () => {
      tl.kill();
    };
  }, []);

  if (gone) return null;
  return (
    <div
      ref={root}
      className="preloader fixed inset-0 z-[100] bg-night text-star"
      style={{
        WebkitMaskImage: "radial-gradient(circle at 50% var(--y, 118vh), transparent var(--r, 0px), #000 calc(var(--r, 0px) + 1px))",
        maskImage: "radial-gradient(circle at 50% var(--y, 118vh), transparent var(--r, 0px), #000 calc(var(--r, 0px) + 1px))",
      }}
      aria-hidden
    >
      <div data-pre="ctn" className="flex h-full flex-col items-center justify-center gap-[3vh]">
        {/* the moon as a progress meter: a shadow slides off a full disc */}
        <div className="relative h-[clamp(54px,5vw,84px)] w-[clamp(54px,5vw,84px)] overflow-hidden rounded-full bg-[#ece7d9]">
          <div data-pre="shade" className="absolute inset-0 rounded-full bg-[#0f1c20]" />
        </div>
        <h2 data-pre="h" className="t-display invisible text-[clamp(64px,10vw,180px)]">Luna</h2>
        <p data-pre="p" className="t-label invisible text-center text-star/70">A night-sky guide that works with no signal</p>
      </div>
    </div>
  );
}
