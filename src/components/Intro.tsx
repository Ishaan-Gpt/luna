"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue } from "motion/react";

/**
 * "The window opens." The planisphere mark draws itself, its star lights,
 * then the page is revealed through the mark's oval window as it grows past the screen.
 * Plays once per session; an inline script hides it before first paint otherwise.
 */
export function Intro() {
  const [on, setOn] = useState(true);
  const [phase, setPhase] = useState(0);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const mask = useMotionTemplate`radial-gradient(ellipse ${rx}px ${ry}px at 50% 47%, transparent 98%, #000 100%)`;

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== "playing") {
      const t = setTimeout(() => setOn(false), 0);
      return () => clearTimeout(t);
    }
    const timers = [
      setTimeout(() => setPhase(1), 1250),
      setTimeout(() => {
        setPhase(2);
        const big = Math.hypot(window.innerWidth, window.innerHeight) * 1.1;
        animate(rx, big * 1.25, { duration: 1.1, ease: [0.76, 0, 0.24, 1] });
        animate(ry, big, { duration: 1.1, ease: [0.76, 0, 0.24, 1] });
      }, 1750),
      setTimeout(() => {
        try {
          sessionStorage.setItem("luna-intro", "1");
        } catch {}
        html.dataset.intro = "done";
        setOn(false);
      }, 2950),
    ];
    return () => timers.forEach(clearTimeout);
  }, [rx, ry]);

  if (!on) return null;

  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r1 = 96;
    const r2 = i % 12 === 0 ? 84 : i % 4 === 0 ? 89 : 92;
    return `M${(100 + Math.sin(a) * r1).toFixed(2)} ${(100 - Math.cos(a) * r1).toFixed(2)}L${(100 + Math.sin(a) * r2).toFixed(2)} ${(100 - Math.cos(a) * r2).toFixed(2)}`;
  }).join("");

  return (
    <motion.div
      className="intro-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night"
      style={phase === 2 ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      aria-hidden
    >
      <svg width="200" height="200" viewBox="0 0 200 200" className="w-[44vmin] max-w-[260px] h-auto">
        <motion.circle cx="100" cy="100" r="99" stroke="var(--brass)" strokeWidth="1" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
        <motion.path d={ticks} stroke="var(--brass)" strokeWidth="1" strokeLinecap="round"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }} />
        <motion.ellipse cx="100" cy="88" rx="52" ry="42" stroke="var(--star)" strokeWidth="1.4" fill="rgba(16,32,31,.6)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />
        <motion.path
          d="M100 60c1.8 16 7 24.6 28.6 28.6-21.6 4-26.8 12.6-28.6 28.6-1.8-16-7-24.6-28.6-28.6 21.6-4 26.8-12.6 28.6-28.6z"
          fill="var(--torch)"
          style={{ transformOrigin: "100px 88px" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <motion.p
        className="display mt-6 text-[clamp(2rem,6vmin,3.2rem)] italic"
        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Luna
      </motion.p>
    </motion.div>
  );
}
