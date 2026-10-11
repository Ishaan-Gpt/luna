"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade, rise and un-blur once on enter. Filter is cleared afterwards so glass inside can blur. */
export function Reveal({ children, delay = 0, className = "", y = 20 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.85, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function Char({ c, i, n, p }: { c: string; i: number; n: number; p: MotionValue<number> }) {
  const start = i / n;
  const opacity = useTransform(p, [start * 0.85, start * 0.85 + 0.15], [0.22, 1]);
  return <motion.span style={{ opacity }}>{c}</motion.span>;
}

/**
 * Two-line section heading. The italic line inks in letter by letter as it scrolls
 * from 90% to 45% of the viewport. Nothing sits above it.
 */
export function SectionHeading({ plain, italic, className = "", as = "h2", align = "center" }: { plain: string; italic: string; className?: string; as?: "h1" | "h2"; align?: "center" | "left" }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "start 45%"] });
  const Tag = as;
  const chars = italic.split("");
  return (
    <Tag ref={ref} className={`display text-[clamp(2.6rem,6.4vw,5.6rem)] ${align === "center" ? "text-center" : ""} ${className}`}>
      <span className="block">{plain}</span>
      <em className="block" aria-label={italic}>
        {reduce
          ? italic
          : chars.map((c, i) => <Char key={i} c={c} i={i} n={chars.length} p={scrollYProgress} />)}
      </em>
    </Tag>
  );
}

/** Small spring pull toward the pointer. Mouse only. */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 500, damping: 30 });
  const sy = useSpring(y, { stiffness: 500, damping: 30 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      x.set((e.clientX - (r.left + r.width / 2)) * strength);
      y.set((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      x.set(0);
      y.set(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [reduce, strength, x, y]);
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} className="inline-block">
      {children}
    </motion.div>
  );
}
