"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { BP, fitText, gsap, initParallax, initReveals, reduced, ScrollTrigger, setupGsap } from "@/lib/motion";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Boots the page's motion once: smooth scroll on GSAP's ticker, reveals, parallax, fit text,
 * the emblem that spins with scroll velocity, the progress rail, magnetic buttons,
 * and chrome that changes tone over light and dark sections.
 */
export function LunaMotion() {
  useEffect(() => {
    setupGsap();
    const cleanups: (() => void)[] = [];
    const reduce = reduced();

    // Smooth scroll
    let lenis: Lenis | null = null;
    if (!reduce) {
      lenis = new Lenis({ duration: 1.2, smoothWheel: true, touchMultiplier: 2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
        lenis!.destroy();
        window.__lenis = undefined;
      });
    }

    fitText();
    const onResize = () => {
      fitText();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    cleanups.push(initReveals());
    cleanups.push(initParallax());

    // Phones: the fixed emblem and nav would sit on top of the copy, so they step aside while
    // you scroll down and come back the moment you scroll up (or reach the top).
    const chrome = document.querySelector<HTMLElement>(".chrome");
    if (chrome) {
      let last = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        const phone = window.innerWidth < 1024;
        if (!phone || y < 120 || y < last - 4) delete chrome.dataset.hide;
        else if (y > last + 4) chrome.dataset.hide = "";
        last = y;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    // Emblem ring: always turning, faster and in the scroll direction while scrolling
    const ring = document.querySelector<HTMLElement>("[data-emblem-ring]");
    if (ring && !reduce) {
      const state = { speed: 18 };
      let rot = 0;
      let dir = 1;
      let idle: ReturnType<typeof setTimeout> | undefined;
      const spin = (_t: number, dt: number) => {
        rot += state.speed * (Math.min(dt, 100) / 1000);
        gsap.set(ring, { rotation: rot, transformOrigin: "50% 50%" });
      };
      gsap.ticker.add(spin);
      const onScroll = ({ velocity }: { velocity: number }) => {
        if (velocity !== 0) dir = velocity > 0 ? 1 : -1;
        gsap.to(state, { speed: dir * (18 + 9 * Math.abs(velocity)), duration: 0.3, ease: "Out", overwrite: true });
        clearTimeout(idle);
        idle = setTimeout(() => gsap.to(state, { speed: 18 * dir, duration: 1.2, ease: "Out" }), 120);
      };
      lenis?.on("scroll", onScroll);
      cleanups.push(() => gsap.ticker.remove(spin));
    }

    // Progress rail
    const rail = document.querySelector<HTMLElement>("[data-rail]");
    if (rail) {
      const label = rail.querySelector<HTMLElement>("[data-rail-label]");
      const st = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (s) => {
          rail.style.setProperty("--progress", `${s.progress * 100}%`);
          if (label) label.textContent = String(Math.round(s.progress * 100)).padStart(2, "0");
        },
      });
      cleanups.push(() => st.kill());
    }

    // Magnetic buttons (desktop pointers only)
    if (!reduce && window.innerWidth >= BP) {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const inner = el.querySelector<HTMLElement>("[data-magnetic-inner]");
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(el, { x: x * 26, y: y * 26, duration: 1.6, ease: "power4.out" });
          if (inner) gsap.to(inner, { x: x * 14, y: y * 14, duration: 2, ease: "power4.out" });
        };
        const leave = () => {
          gsap.to([el, inner].filter(Boolean), { x: 0, y: 0, duration: 1.6, ease: "elastic.out(1, 0.3)" });
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    // Chrome tone: each fixed piece reads the section under its own centre
    const tones = document.querySelectorAll<HTMLElement>("[data-tone-target]");
    const sections = document.querySelectorAll<HTMLElement>("[data-bg]");
    tones.forEach((t) => {
      const r = t.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const cx = r.left + r.width / 2;
      sections.forEach((s) => {
        const sr = s.getBoundingClientRect();
        if (cx < sr.left || cx > sr.right) return;
        const tone = s.dataset.bg!;
        const st = ScrollTrigger.create({
          trigger: s,
          start: () => `top top+=${cy}`,
          end: () => `bottom top+=${cy}`,
          onEnter: () => (t.dataset.tone = tone),
          onEnterBack: () => (t.dataset.tone = tone),
          onRefresh: (self) => { if (self.isActive) t.dataset.tone = tone; },
        });
        cleanups.push(() => st.kill());
      });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());

    // Dev aid for headless screenshots: ?shot=<y> jumps straight to a scroll position.
    const shot = new URLSearchParams(location.search).get("shot");
    if (shot !== null) {
      setTimeout(() => {
        const y = Number(shot);
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        ScrollTrigger.update();
      }, 600);
    }
    return () => cleanups.forEach((c) => c());
  }, []);
  return null;
}

/** Smooth-scroll to an anchor or the top, falling back to native scrolling. */
export function scrollToTarget(target: string | number) {
  if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.6 });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}
