"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DUR, fitText, gsap, reduced, setupGsap, SplitText } from "@/lib/motion";
import { ArrowLeft, ArrowRight } from "./primitives";

const SLIDES = [
  {
    title: "Works offline",
    img: "/art/tent-stars.webp",
    alt: "A lit tent under the Milky Way below a dark peak",
    body: "Luna carries the sky with it: a star catalogue, the maths to place every star for any second, and an open model that explains what you are looking at. Up a pass at 4,500 metres, it still knows.",
  },
  {
    title: "Point and ask",
    img: "/art/rooftop-city.webp",
    alt: "A city terrace at night with water tanks and a few bright stars",
    body: "Aim your phone, hold the button and ask out loud. Gemma runs on the phone, uses the compass to know what you mean by that one, and answers in a sentence you can follow with your eyes.",
  },
  {
    title: "The sky is the setup",
    img: "/art/lake-night.webp",
    alt: "A crescent moon over a still lake with the Milky Way rising",
    body: "Before Luna shows you anything, it asks you to look up and match what you see. From then on it only points at what your sky can really show, city or not.",
  },
];
const AUTO = 6.5;

/** The three reasons, one at a time: a giant title, a small picture, a short paragraph. Auto-advances in view. */
export function Reasons() {
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const busy = useRef(false);
  const timer = useRef<gsap.core.Tween | null>(null);
  const visible = useRef(false);

  const go = useCallback((next: number) => {
    const el = root.current;
    if (!el || busy.current) return;
    const n = (next + SLIDES.length) % SLIDES.length;
    if (n === i) return;
    busy.current = true;
    const titles = el.querySelectorAll<HTMLElement>("[data-r-title]");
    const imgs = el.querySelectorAll<HTMLElement>("[data-r-img]");
    const bodies = el.querySelectorAll<HTMLElement>("[data-r-body]");
    const out = titles[i] as HTMLElement & { _split?: SplitText };
    const inn = titles[n] as HTMLElement & { _split?: SplitText };
    out._split ??= new SplitText(out, { type: "words,chars", wordsClass: "split-word", charsClass: "split-char" });
    inn._split ??= new SplitText(inn, { type: "words,chars", wordsClass: "split-word", charsClass: "split-char" });
    const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
    if (reduced()) {
      gsap.set([titles, imgs, bodies], { autoAlpha: 0 });
      gsap.set([titles[n], imgs[n], bodies[n]], { autoAlpha: 1 });
      busy.current = false;
    } else {
      tl.to(out._split.chars, { opacity: 0, yPercent: -50, rotateY: -90, duration: DUR.s, stagger: 0.02, ease: "In" }, 0)
        .to(bodies[i], { autoAlpha: 0, y: -12, duration: DUR.s, ease: "In" }, 0)
        .set(titles[n], { autoAlpha: 1 })
        .fromTo(inn._split.chars, { opacity: 0, yPercent: 50, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, duration: DUR.l, stagger: 0.035, ease: "Out" }, DUR.s * 0.8)
        .set(titles[i], { autoAlpha: 0 })
        .fromTo(imgs[n], { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: DUR.m, ease: "InOut" }, 0.1)
        .to(imgs[i], { autoAlpha: 0, duration: DUR.m, ease: "InOut" }, 0.1)
        .fromTo(bodies[n], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: DUR.m, ease: "Out" }, DUR.s + 0.1);
    }
    setI(n);
  }, [i]);

  // auto-advance with a visible progress line, only while the section is on screen
  useEffect(() => {
    setupGsap();
    const el = root.current!;
    const bar = el.querySelector<HTMLElement>("[data-r-bar]");
    timer.current?.kill();
    if (reduced() || !bar) return;
    timer.current = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: AUTO, ease: "none", paused: !visible.current, onComplete: () => go(i + 1) });
    return () => {
      timer.current?.kill();
    };
  }, [i, go]);

  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting) timer.current?.play();
      else timer.current?.pause();
    }, { threshold: 0.35 });
    io.observe(el);
    const hover = el.querySelector("[data-r-stage]");
    const pause = () => timer.current?.pause();
    const play = () => visible.current && timer.current?.play();
    hover?.addEventListener("pointerenter", pause);
    hover?.addEventListener("pointerleave", play);
    fitText(el);
    return () => {
      io.disconnect();
      hover?.removeEventListener("pointerenter", pause);
      hover?.removeEventListener("pointerleave", play);
    };
  }, []);

  return (
    <section id="reasons" ref={root} data-bg="moon" className="relative z-10 bg-moon pb-[14vh] text-ink" aria-roledescription="carousel" aria-label="Three reasons">
      <div className="gut relative" data-reveal-group>
        <div className="relative h-[15vw] max-lg:h-[22vw]">
          {SLIDES.map((s, k) => (
            <div key={s.title} className="absolute inset-x-0 top-0 flex justify-center" aria-hidden={k !== i}>
              <h2 data-r-title data-fit {...(k === 0 ? { "data-reveal": "h" } : { style: { visibility: "hidden" } })} className="t-display text-[12vw] leading-[0.86]">
                {s.title}
              </h2>
            </div>
          ))}
        </div>
      </div>

      <div data-r-stage className="mt-[5vh] flex flex-col items-center">
        <div className="relative aspect-[16/10] w-[26vw] overflow-hidden bg-ink max-lg:w-[72vw]" data-reveal="ctn">
          {SLIDES.map((s, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.img} data-r-img src={s.img} alt={s.alt} className="absolute inset-0 h-full w-full object-cover" style={{ visibility: k === 0 ? "visible" : "hidden" }} />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-5" data-reveal="ctn">
          <button onClick={() => go(i - 1)} aria-label="Previous reason" className="p-1 opacity-70 transition-opacity hover:opacity-100"><ArrowLeft /></button>
          <span className="t-label tnum">{String(i + 1).padStart(2, "0")}</span>
          <span className="relative h-px w-[clamp(90px,9vw,160px)] bg-ink/20">
            <span data-r-bar className="absolute inset-0 origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
          </span>
          <span className="t-label tnum opacity-50">{String(SLIDES.length).padStart(2, "0")}</span>
          <button onClick={() => go(i + 1)} aria-label="Next reason" className="p-1 opacity-70 transition-opacity hover:opacity-100"><ArrowRight /></button>
        </div>

        <div className="relative mt-[5vh] grid w-full max-w-[34ch] place-items-center text-center max-lg:max-w-[30ch]">
          {SLIDES.map((s, k) => (
            <p key={s.title} data-r-body className="t-body col-start-1 row-start-1" style={{ visibility: k === 0 ? "visible" : "hidden" }}>
              {s.body}
            </p>
          ))}
        </div>

        <a href="#open" className="t-label ulink mt-[5vh]" data-reveal="ctn">Why it runs on an open model</a>
      </div>
    </section>
  );
}
