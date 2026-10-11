"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useSky } from "@/lib/sky-context";
import { compass, fmtLat, fmtLon, lst, placeStars } from "@/lib/sky";
import { Reveal, SectionHeading } from "../motion-bits";
import { IconCompass, IconNoSignal, IconSatellite, IconClock } from "../icons";

function Card({ children, delay, title, Icon, body }: { children: React.ReactNode; delay: number; title: string; Icon: typeof IconCompass; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 0, on: false });
  return (
    <Reveal delay={delay} className="h-full">
      <div
        ref={ref}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, on: true });
        }}
        onPointerLeave={() => setSpot((s) => ({ ...s, on: false }))}
        className="group glass relative flex h-full flex-col overflow-hidden rounded-[24px] p-6"
      >
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{ opacity: spot.on ? 1 : 0, background: `radial-gradient(320px circle at ${spot.x}% ${spot.y}%, rgba(229,83,61,.10), transparent 60%)` }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl glass-inset text-star transition-transform duration-500 [transition-timing-function:var(--spring)] group-hover:-rotate-8 group-hover:scale-110">
            <Icon size={20} />
          </span>
          <h3 className="display text-[1.7rem]">{title}</h3>
        </div>
        <div className="relative my-6 flex-1">{children}</div>
        <p className="relative text-[0.95rem] leading-relaxed text-star-2">{body}</p>
      </div>
    </Reveal>
  );
}

export function Offline() {
  const { loc, now } = useSky();
  const reduce = useReducedMotion();
  const heading = useMotionValue(200);
  const spring = useSpring(heading, { stiffness: 60, damping: 14 });
  const [deg, setDeg] = useState(200);
  const [tick, setTick] = useState<Date | null>(null);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => spring.on("change", (v) => setDeg(((Math.round(v) % 360) + 360) % 360)), [spring]);
  useEffect(() => {
    const i = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Desktop: the compass follows the pointer across the section. Touch: it slowly sweeps.
  useEffect(() => {
    if (reduce) return;
    let sweep: ReturnType<typeof setInterval> | null = null;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      heading.set(90 + (e.clientX / window.innerWidth) * 180);
    };
    if (matchMedia("(pointer: coarse)").matches) {
      sweep = setInterval(() => heading.set(heading.get() + 35), 2600);
    }
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      if (sweep) clearInterval(sweep);
    };
  }, [heading, reduce]);

  // What's brightest roughly in the direction you face, right now
  const facing = useMemo(() => {
    if (!now) return null;
    const stars = placeStars(now, loc).filter((s) => s.alt > 8 && s.alt < 75);
    const diff = (a: number) => Math.abs(((a - deg + 540) % 360) - 180);
    const near = stars.filter((s) => diff(s.az) < 30).sort((a, b) => a.mag - b.mag);
    return near[0] ?? null;
  }, [now, loc, deg]);

  const sid = tick ? lst(tick, loc.lon) / 15 : null;
  const sidStr = sid !== null ? `${String(Math.floor(sid)).padStart(2, "0")}h ${String(Math.floor((sid % 1) * 60)).padStart(2, "0")}m ${String(Math.floor(((sid * 60) % 1) * 60)).padStart(2, "0")}s` : "--h --m --s";

  return (
    <section ref={area} className="relative z-10 mt-36 px-4 sm:px-6 md:mt-52">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex justify-center">
          <span className="mb-8 grid h-14 w-14 place-items-center rounded-2xl glass text-torch-ink">
            <IconNoSignal size={26} />
          </span>
        </div>
        <SectionHeading plain="No bars." italic="No problem." />
        <p className="mx-auto mt-6 max-w-[600px] text-center text-[1.05rem] leading-relaxed text-star-2">
          Your phone already has what it takes to read the sky: GPS that works without mobile data, a compass, a gyroscope and a clock. Luna adds an onboard star catalogue and the maths to place every star, for any second, anywhere.
        </p>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <Card delay={0} title="Where you are" Icon={IconSatellite} body="A GPS fix comes from satellites, not the network. Up a mountain, in a desert, on a boat, it still knows where you're standing.">
            <div className="glass-inset rounded-2xl p-4">
              <p className="mono text-[1.25rem] tnum">{fmtLat(loc.lat)}</p>
              <p className="mono text-[1.25rem] tnum">{fmtLon(loc.lon)}</p>
              <div className="mt-3 flex items-center gap-2 text-[0.78rem] text-star-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-sage" style={{ animation: reduce ? undefined : `twinkle 2.4s ${i * 0.3}s infinite` }} />
                ))}
                <span className="ml-1">satellite fix, 0 KB of data</span>
              </div>
            </div>
          </Card>

          <Card delay={0.08} title="Where you face" Icon={IconCompass} body="The compass and gyroscope tell Luna where your phone is pointing, so the labels sit on the right stars as you move.">
            <div className="flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0 rounded-full glass-inset">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                  {Array.from({ length: 36 }, (_, i) => {
                    const a = (i * 10 * Math.PI) / 180;
                    const r2 = i % 9 === 0 ? 38 : 42;
                    return (
                      <line key={i} x1={(50 + Math.sin(a) * 46).toFixed(2)} y1={(50 - Math.cos(a) * 46).toFixed(2)} x2={(50 + Math.sin(a) * r2).toFixed(2)} y2={(50 - Math.cos(a) * r2).toFixed(2)}
                        stroke="var(--brass)" strokeOpacity={i % 9 === 0 ? 1 : 0.5} strokeWidth="1" strokeLinecap="round" />
                    );
                  })}
                  <text x="50" y="22" textAnchor="middle" fontSize="8" fill="var(--torch-ink)" className="mono">N</text>
                </svg>
                <motion.div className="absolute inset-0" style={{ rotate: spring }}>
                  <span className="absolute left-1/2 top-[14%] h-[36%] w-[3px] -translate-x-1/2 rounded-full bg-torch shadow-[0_0_12px_rgba(229,83,61,.7)]" />
                  <span className="absolute left-1/2 top-1/2 h-[30%] w-[3px] -translate-x-1/2 rounded-full bg-star-3" />
                </motion.div>
                <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-star" />
              </div>
              <div>
                <p className="mono text-[1.4rem] tnum">{deg}° {compass(deg)}</p>
                <p className="mt-1 text-[0.85rem] text-star-3">Brightest that way now</p>
                <p className="display text-[1.5rem] leading-tight">{facing ? facing.name : now ? "Open sky" : "—"}</p>
              </div>
            </div>
          </Card>

          <Card delay={0.16} title="What time the sky says" Icon={IconClock} body="Stars keep sidereal time, about four minutes shorter than a solar day. From the clock and your longitude, Luna knows exactly how the sky has turned.">
            <div className="glass-inset rounded-2xl p-4">
              <p className="text-[0.78rem] text-star-3">Local sidereal time, {loc.name}</p>
              <p className="mono mt-1 text-[1.5rem] tnum">{sidStr}</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-brass" style={{ width: `${sid !== null ? (sid / 24) * 100 : 0}%`, transition: "width 1s linear" }} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
