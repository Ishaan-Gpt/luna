"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useSky } from "@/lib/sky-context";
import { fmtTime, sunAltAz, twilightName } from "@/lib/sky";
import { LogoMark, Wordmark } from "./Logo";

const LINKS = [
  { href: "#tonight", label: "Tonight" },
  { href: "#places", label: "Dark places" },
  { href: "#yours", label: "Your stars" },
  { href: "#any-night", label: "Any night" },
];

export function Nav() {
  const { scrollY } = useScroll();
  const { progress, timeAt, loc } = useSky();
  const [floating, setFloating] = useState(false);
  const [clock, setClock] = useState<{ time: string; phase: string } | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => setFloating(y > 40));
  const tick = (p: number) => {
    const t = timeAt(p);
    if (!t) return;
    setClock({ time: fmtTime(t, loc.tz), phase: twilightName(sunAltAz(t, loc).alt) });
  };
  useMotionValueEvent(progress, "change", tick);
  if (!clock && timeAt(0)) setTimeout(() => tick(progress.get()), 0);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
      <motion.nav
        initial={false}
        animate={{ maxWidth: floating ? 1040 : 1400 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`flex w-full items-center justify-between gap-4 rounded-2xl px-3 py-2 transition-[background,border-color,box-shadow] duration-500 sm:px-4 ${floating ? "glass" : "border border-transparent"}`}
      >
        <a href="#top" className="flex items-center gap-2.5 rounded-lg" aria-label="Luna, back to top">
          <LogoMark size={30} />
          <Wordmark className="text-[1.6rem] leading-none" />
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-lg px-3 py-2 text-[0.92rem] text-star-2 transition-colors hover:text-star">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <div className="hidden text-right lg:block" aria-live="off" title="The time this part of the page shows, at the chosen location">
            <p className="mono text-[0.78rem] text-star tnum">{clock?.time ?? "--:--"}</p>
            <p className="text-[0.7rem] text-star-3">{clock?.phase ?? "Tonight"} · {loc.name}</p>
          </div>
          <a href="#waitlist" className="btn-torch !h-10 !px-4 text-[0.9rem]">Join the waitlist</a>
        </div>
      </motion.nav>
    </header>
  );
}
