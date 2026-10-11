"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { drawPanorama } from "@/lib/panorama";
import { setupCanvas } from "@/lib/draw";
import { compass, eqToHor, fmtDate, fmtTime, HANLE, lst, placeStars, planetsAltAz, precessor, tonight } from "@/lib/sky";
import { CONSTELLATIONS, LINES, STARS, STAR_BY_ID } from "@/lib/stars";
import { SkyDial } from "../SkyDial";
import { tonightAt } from "./HeroSky";
import { Mark } from "./primitives";

/** Tonight at 20:30 over Hanle, computed after mount. */
export function useTonight() {
  const [d, setD] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setD(tonightAt(HANLE)), 0);
    return () => clearTimeout(t);
  }, []);
  return d;
}

const fistsUp = (alt: number) => {
  const f = Math.max(1, Math.round(alt / 10));
  return `${f === 1 ? "one fist" : `${["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine"][f] ?? f} fists`}`;
};
const DIRS: Record<string, string> = { N: "north", NNE: "north-northeast", NE: "northeast", ENE: "east-northeast", E: "east", ESE: "east-southeast", SE: "southeast", SSE: "south-southeast", S: "south", SSW: "south-southwest", SW: "southwest", WSW: "west-southwest", W: "west", WNW: "west-northwest", NW: "northwest", NNW: "north-northwest" };

/** The brightest things above 12° at the given moment, planets first by brightness. */
function brightest(date: Date, n = 3) {
  const stars = placeStars(date, HANLE).filter((s) => s.alt > 12).map((s) => ({ name: s.name, alt: s.alt, az: s.az, mag: s.mag, kind: "star" as const }));
  const planets = planetsAltAz(date, HANLE).filter((p) => p.alt > 12).map((p) => ({ name: p.name, alt: p.alt, az: p.az, mag: p.mag, kind: "planet" as const }));
  return [...planets, ...stars].sort((a, b) => a.mag - b.mag).slice(0, n);
}

/* ---------- phone frame ---------- */
export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative aspect-[9/19.5] w-full rounded-[14%/6.5%] border border-ink/25 bg-[#050708] p-[3.2%] shadow-[0_40px_80px_-40px_rgba(14,26,31,.55)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[11%/5.2%] bg-black">
        <span className="absolute left-1/2 top-[1.6%] z-20 h-[2.4%] w-[28%] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

/* ---------- Point & Ask: red night mode, a reticle on the target, the spoken answer ---------- */
export function PointAskScreen() {
  const date = useTonight();
  const cv = useRef<HTMLCanvasElement>(null);
  const target = useMemo(() => (date ? brightest(date, 1)[0] : null), [date]);
  useEffect(() => {
    const c = cv.current;
    if (!c || !date || !target) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    drawPanorama(setupCanvas(c, w, h), w, h, { date, loc: HANLE, mode: "dark", az0: target.az, alt0: target.alt, vfov: 46 });
  }, [date, target]);
  const answer = target
    ? `That's ${target.name}. ${fistsUp(target.alt)[0].toUpperCase()}${fistsUp(target.alt).slice(1)} above the ${DIRS[compass(target.az)]} horizon${target.kind === "planet" ? ", brighter than any star out tonight." : "."}`
    : "";
  return (
    <div className="absolute inset-0 flex flex-col bg-[#090202] pt-[11%] text-[#ff6a52]" style={{ fontSize: "clamp(9px, .72vw, 13px)" }}>
      <div className="flex items-center justify-between px-[7%]">
        <span className="t-label !text-[0.85em] !tracking-[0.24em]">Point &amp; ask</span>
        <span className="t-label flex items-center gap-1.5 !text-[0.8em] !tracking-[0.18em] opacity-80"><i className="h-1.5 w-1.5 rounded-full bg-[#ff6a52]" />On device</span>
      </div>
      <div className="relative mx-[7%] mt-[6%] aspect-square overflow-hidden rounded-[6%] border border-[#ff6a52]/25">
        <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ filter: "grayscale(1) sepia(1) saturate(5) hue-rotate(-38deg) brightness(.75) contrast(1.2)" }} />
        <span className="absolute left-1/2 top-1/2 h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff6a52]" />
        <span className="absolute left-1/2 top-[30%] h-[8%] w-px -translate-x-1/2 bg-[#ff6a52]/70" />
        <span className="absolute bottom-[30%] left-1/2 h-[8%] w-px -translate-x-1/2 bg-[#ff6a52]/70" />
      </div>
      <div className="mt-[7%] flex flex-col gap-[0.8em] px-[7%]">
        <p className="self-end rounded-[1em] border border-[#ff6a52]/30 px-[1em] py-[0.6em] text-right leading-snug opacity-80">&ldquo;What&rsquo;s the bright one over there?&rdquo;</p>
        <p className="leading-snug">{answer || <span className="opacity-50">Listening…</span>}</p>
      </div>
      <div className="mt-auto grid place-items-center pb-[9%]">
        <span className="grid h-[3.4em] w-[3.4em] place-items-center rounded-full border border-[#ff6a52]/50">
          <span className="h-[1.6em] w-[1.6em] rounded-full bg-[#ff6a52]" />
        </span>
        <span className="t-label mt-[0.8em] !text-[0.75em] opacity-70">Hold to ask</span>
      </div>
    </div>
  );
}

/* ---------- Sky Check: which of these looks like your sky? ---------- */
const LIMITS = [1.6, 2.6, 3.6, 4.6];
function constellationTonight(date: Date) {
  const L = lst(date, HANLE.lon);
  const P = precessor(date);
  let best: { con: string; alt: number } | null = null;
  for (const con of CONSTELLATIONS) {
    const st = STARS.filter((s) => s.con === con);
    if (st.length < 5) continue;
    const alts = st.map((s) => {
      const p = P(s.ra, s.dec);
      return eqToHor(p.ra, p.dec, HANLE.lat, L).alt;
    });
    const min = Math.min(...alts);
    const mean = alts.reduce((a, b) => a + b, 0) / alts.length;
    if (min > 15 && (!best || mean > best.alt)) best = { con, alt: mean };
  }
  return best?.con ?? "Cassiopeia";
}
function Constellation({ con, limit }: { con: string; limit: number }) {
  const stars = STARS.filter((s) => s.con === con);
  const ids = new Set(stars.map((s) => s.id));
  const dec0 = stars.reduce((a, s) => a + s.dec, 0) / stars.length;
  // unwrap RA around the constellation's middle
  const ra0 = stars[0].ra;
  const pts = stars.map((s) => {
    let dra = s.ra - ra0;
    if (dra > 180) dra -= 360;
    if (dra < -180) dra += 360;
    return { ...s, x: -dra * Math.cos((dec0 * Math.PI) / 180), y: -s.dec };
  });
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0) || 1;
  const P = (p: { x: number; y: number }) => ({ x: 12 + ((p.x - x0) / span) * 76 + (76 - ((x1 - x0) / span) * 76) / 2, y: 12 + ((p.y - y0) / span) * 76 + (76 - ((y1 - y0) / span) * 76) / 2 });
  const byId = Object.fromEntries(pts.map((p) => [p.id, P(p)]));
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      {LINES.filter(([a, b]) => ids.has(a) && ids.has(b) && STAR_BY_ID[a].mag <= limit && STAR_BY_ID[b].mag <= limit).map(([a, b]) => (
        <line key={a + b} x1={byId[a].x.toFixed(1)} y1={byId[a].y.toFixed(1)} x2={byId[b].x.toFixed(1)} y2={byId[b].y.toFixed(1)} stroke="#c9b98f" strokeOpacity=".35" strokeWidth=".6" />
      ))}
      {pts.filter((p) => p.mag <= limit).map((p) => (
        <circle key={p.id} cx={byId[p.id].x.toFixed(1)} cy={byId[p.id].y.toFixed(1)} r={Math.max(0.8, 3.2 - p.mag * 0.62).toFixed(2)} fill="#f3f1ea" />
      ))}
    </svg>
  );
}
export function SkyCheckScreen() {
  const date = useTonight();
  const con = useMemo(() => (date ? constellationTonight(date) : "Cassiopeia"), [date]);
  const [pick, setPick] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setPick((p) => (p + 1) % LIMITS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a1316] px-[7%] pt-[12%] text-star" style={{ fontSize: "clamp(9px, .72vw, 13px)" }}>
      <span className="t-label !text-[0.85em] !tracking-[0.22em] text-star/70">Sky check · {con}</span>
      <p className="t-display mt-[0.6em] text-[2.2em] leading-[0.95]">Which one looks like your sky?</p>
      <div className="mt-[8%] grid grid-cols-2 gap-[5%]">
        {LIMITS.map((lim, k) => (
          <div key={lim} className={`relative aspect-square rounded-[8%] border transition-colors duration-500 ${k === pick ? "border-torch bg-white/[0.04]" : "border-star/15"}`}>
            <Constellation con={con} limit={lim} />
            <span className="t-label absolute bottom-[6%] left-[8%] !text-[0.7em] !tracking-[0.16em] text-star/60">mag {lim.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <p className="mt-auto pb-[10%] leading-snug text-star/75">
        Your sky shows stars to <span className="text-torch">magnitude {LIMITS[pick].toFixed(1)}</span>. Luna will only point at what you can see.
      </p>
    </div>
  );
}

/* ---------- Paper Exit: tonight as a lock screen ---------- */
export function LockScreen() {
  const date = useTonight();
  const data = useMemo(() => {
    if (!date) return null;
    const n = tonight(new Date(date.getTime() - 4 * 3600000), HANLE);
    return { picks: brightest(date, 3), n };
  }, [date]);
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-[#05090b] via-[#0b1a1d] to-[#1c3530] px-[8%] pt-[16%] text-star" style={{ fontSize: "clamp(9px, .72vw, 13px)" }}>
      <span className="t-label !text-[0.8em] text-star/70">{date ? fmtDate(date, HANLE.tz, { weekday: "long", day: "numeric", month: "long" }) : " "}</span>
      <span className="t-display mt-[0.2em] text-[6.4em] leading-[0.9]">{date ? fmtTime(date, HANLE.tz) : "--:--"}</span>
      <div className="mt-[10%] w-full rounded-[1.2em] border border-star/15 bg-black/35 p-[1.2em] backdrop-blur-sm">
        <div className="flex items-center gap-2 text-star/80">
          <Mark size={16} />
          <span className="t-label !text-[0.75em] !tracking-[0.2em]">Tonight from Hanle</span>
        </div>
        <ul className="mt-[0.9em] grid gap-[0.65em]">
          {data?.picks.map((p) => (
            <li key={p.name} className="flex items-baseline justify-between gap-3">
              <span className="t-display text-[1.7em] leading-none">{p.name}</span>
              <span className="text-right text-star/70">{fistsUp(p.alt)} · {compass(p.az)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-[1em] border-t border-star/10 pt-[0.8em] text-star/70">
          Truly dark {data ? `${fmtTime(data.n.darkStart, HANLE.tz)}–${fmtTime(data.n.darkEnd, HANLE.tz)}` : ""}
        </p>
      </div>
      <span className="t-label mt-auto pb-[9%] !text-[0.7em] text-star/50">No unlock needed</span>
    </div>
  );
}

/* ---------- Any night: the sky on another date ---------- */
const Y2K = new Date("1999-12-31T18:30:00Z"); // midnight, 1 Jan 2000, in India
export function AnyNightScreen() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col bg-[#081115] px-[7%] pt-[12%] text-star" style={{ fontSize: "clamp(9px, .72vw, 13px)" }}>
      <span className="t-label !text-[0.85em] !tracking-[0.22em] text-star/70">Any night</span>
      <p className="t-display mt-[0.6em] text-[2.2em] leading-[0.95]">The first night of 2000</p>
      <div className="mt-[8%]">
        <SkyDial date={ready ? Y2K : null} loc={HANLE} showLabels={false} label="Sky over Hanle at midnight on 1 January 2000" />
      </div>
      <div className="mt-[6%] flex items-center justify-between rounded-full border border-star/20 px-[1.1em] py-[0.7em]">
        <span>1 Jan 2000</span>
        <span className="text-star/60">00:00</span>
      </div>
      <p className="mt-auto pb-[10%] leading-snug text-star/70">Pick any date from 1000 to 2999. Star positions are corrected for the slow wobble of Earth&rsquo;s axis.</p>
    </div>
  );
}
