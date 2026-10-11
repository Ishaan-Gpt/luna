"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

/*
 * Luna motion system. One vocabulary for the whole site:
 *   eases   InOut / Out / In / Ease / diveIn
 *   timing  S 0.4 · M 0.8 · L 1.2 · stagger 0.1 · first reveal delay 0.3
 *   reveals a (script, letters swing in), h (display, letters turn up), p (lines rise from a mask),
 *           ctn (blocks lift), line (hairlines draw down)
 */

export const BP = 992;
export const DUR = { s: 0.4, m: 0.8, l: 1.2 };
export const STAGGER = 0.1;
export const DELAY = 0.3;

let ready = false;
export function setupGsap() {
  if (ready || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create("InOut", "0.75,0,0.25,1");
  CustomEase.create("Out", "0.25,1,0.5,1");
  CustomEase.create("In", "0.5,0,0.75,0");
  CustomEase.create("Ease", "0.25,0.1,0.25,1");
  CustomEase.create("diveIn", "0.6,0,0,1");
  ready = true;
  return gsap;
}

export const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const desktop = () => typeof window !== "undefined" && window.innerWidth >= BP;

type El = HTMLElement & { _split?: SplitText };
type Mode = "reveal" | "initial";

function split(el: El, type: string) {
  if (!el._split) {
    el._split = new SplitText(el, {
      type,
      tag: "span",
      charsClass: "split-char",
      wordsClass: "split-word",
      linesClass: "split-line",
      ...(type.includes("lines") ? { mask: "lines" as const } : {}),
      smartWrap: true,
    });
  }
  return el._split;
}

export function revealA(els: El[], mode: Mode, delay = DELAY) {
  els.forEach((el, i) => {
    const s = split(el, "chars");
    if (mode === "initial") return gsap.set(s.chars, { opacity: 0, rotateX: -90, x: "6rem", transformOrigin: "center top" });
    gsap.fromTo(
      s.chars,
      { opacity: 0, rotateX: 90, x: "6rem", transformOrigin: "center bottom" },
      { opacity: 1, rotateX: 0, x: 0, duration: DUR.l, delay: delay + i * STAGGER, stagger: STAGGER * 0.6, ease: "Out", overwrite: true },
    );
  });
}

export function revealH(els: El[], mode: Mode, delay = DELAY) {
  els.forEach((el, i) => {
    const s = split(el, "words,chars");
    if (mode === "initial") return gsap.set(s.chars, { opacity: 0, yPercent: 50, rotateY: 90 });
    gsap.fromTo(
      s.chars,
      { opacity: 0, yPercent: 50, rotateY: 90 },
      { opacity: 1, yPercent: 0, rotateY: 0, duration: DUR.l, delay: delay + i * STAGGER, stagger: STAGGER * 0.35, ease: "Out", overwrite: true },
    );
  });
}

export function revealP(els: El[], mode: Mode, delay = DELAY) {
  els.forEach((el, i) => {
    const s = split(el, "lines,words");
    if (mode === "initial") return gsap.set(s.lines, { yPercent: 110 });
    gsap.fromTo(s.lines, { yPercent: 110 }, { yPercent: 0, duration: DUR.l, delay: delay + i * STAGGER, stagger: STAGGER, ease: "Out", overwrite: true });
  });
}

export function revealCtn(els: El[], mode: Mode, delay = DELAY) {
  const y = desktop() ? "3.4rem" : "2.4rem";
  if (mode === "initial") return gsap.set(els, { opacity: 0, y });
  gsap.fromTo(els, { opacity: 0, y }, { opacity: 1, y: 0, duration: DUR.l, delay, stagger: STAGGER, ease: "Out", overwrite: true });
}

export function revealLine(els: El[], mode: Mode, delay = DELAY) {
  if (mode === "initial") return gsap.set(els, { clipPath: "inset(0% 0% 100% 0%)" });
  gsap.fromTo(els, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.l, delay, stagger: STAGGER, ease: "Out", overwrite: true });
}

const REVEALS = { a: revealA, h: revealH, p: revealP, ctn: revealCtn, line: revealLine } as const;
export type RevealKind = keyof typeof REVEALS;

/**
 * Every [data-reveal="a|h|p|ctn|line"] reveals once when its group ([data-reveal-group] or itself)
 * enters the viewport. Items inside a horizontal track use that track's tween.
 */
export function initReveals(root: ParentNode = document, horizontal?: gsap.core.Tween | null) {
  const made: ScrollTrigger[] = [];
  const marked: HTMLElement[] = [];
  const cleanup = () => {
    made.forEach((t) => t.kill());
    marked.forEach((el) => delete el.dataset.revealDone);
  };
  if (reduced()) {
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => (el.style.visibility = "visible"));
    return cleanup;
  }
  (Object.keys(REVEALS) as RevealKind[]).forEach((kind) => {
    const groups = new Map<HTMLElement, El[]>();
    root.querySelectorAll<El>(`[data-reveal="${kind}"]`).forEach((el) => {
      if (el.dataset.revealDone) return;
      el.dataset.revealDone = "1";
      marked.push(el);
      const g = (el.closest("[data-reveal-group]") as HTMLElement) ?? el;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(el);
    });
    groups.forEach((items, trigger) => {
      gsap.set(items, { visibility: "visible" });
      REVEALS[kind](items, "initial");
      const inTrack = trigger.closest("[data-horizontal]");
      let fired = false;
      const fire = () => {
        if (fired) return;
        fired = true;
        REVEALS[kind](items, "reveal", Number(trigger.dataset.revealDelay ?? 0.05));
      };
      // onLeave/onEnterBack cover jumps (anchors, reloads mid-page) that skip past the start
      made.push(
        ScrollTrigger.create({
          trigger,
          containerAnimation: inTrack && horizontal ? horizontal : undefined,
          start: inTrack && horizontal ? "left 85%" : "top 88%",
          onEnter: fire,
          onLeave: fire,
          onEnterBack: fire,
        }),
      );
    });
  });
  return cleanup;
}

/** Image parallax inside a clipping wrapper: [data-parallax="w"] > [data-parallax="img"]. */
export function initParallax(root: ParentNode = document) {
  const made: gsap.core.Tween[] = [];
  const cleanup = () => made.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
  if (reduced()) return cleanup;
  root.querySelectorAll<HTMLElement>('[data-parallax="img"]').forEach((img) => {
    const w = img.closest<HTMLElement>('[data-parallax="w"]');
    if (!w) return;
    const amt = Number(img.dataset.amount ?? 12);
    made.push(gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: 0.5 } }));
  });
  root.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
    const d = Number(el.dataset.drift ?? 80);
    made.push(gsap.fromTo(el, { y: d }, { y: -d, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.6 } }));
  });
  return cleanup;
}

/** Shrink-to-fit a single line to its parent's width (the giant words). */
export function fitText(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-fit]").forEach((el) => {
    el.style.whiteSpace = "nowrap";
    el.style.fontSize = "";
    el.style.width = "max-content";
    const pe = el.parentElement!;
    const pcs = getComputedStyle(pe);
    const parent = pe.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
    const own = el.offsetWidth;
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.width = "";
    el.style.fontSize = `${size * (parent / own)}px`;
  });
}

export { gsap, ScrollTrigger, SplitText };
