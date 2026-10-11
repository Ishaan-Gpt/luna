"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useSpring } from "motion/react";
import { fmtLat, HANLE, lst, norm360, tzOffset } from "@/lib/sky";
import { LINES, STARS } from "@/lib/stars";

const D2R = Math.PI / 180;
const C = 300; // centre of the 600 viewBox
const RC = 214; // chart radius
const RD = 256; // disc radius
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Right ascension on the meridian at local midnight for a day of the year (approximate, as on a printed planisphere). */
const raMidnight = (doy: number) => norm360((doy - 80) * (360 / 365.25) + 180);

/**
 * A working planisphere for the current latitude. The star disc turns under a fixed mask whose
 * window is the real horizon; the date ring on the disc lines up with the hour ring on the mask.
 */
export function PlanisphereChapter() {
  const loc = HANLE;
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setNow(new Date()), 0);
    return () => clearTimeout(t);
  }, []);
  const s = loc.lat >= 0 ? 1 : -1; // southern skies centre on the south pole and mirror
  const phi = Math.max(10, Math.abs(loc.lat));
  const decMin = phi - 90 - 4;
  const rOf = (dec: number) => ((90 - s * dec) / (90 - decMin)) * RC;
  // disc coordinates: angle beta0 = -RA (screen: 0 = down, +90 = right), mirrored for the south
  const pt = (ra: number, dec: number) => {
    const b = -ra * s * D2R;
    const r = rOf(dec);
    return { x: r2(C + r * Math.sin(b)), y: r2(C + r * Math.cos(b)) };
  };

  const rot = useMotionValue(0); // = local sidereal time, degrees
  const spring = useSpring(rot, { stiffness: 120, damping: 22 });
  const svgRot = useMotionValue(0);
  useMotionValueEvent(spring, "change", (v) => svgRot.set(-v * s));
  const [lstDeg, setLstDeg] = useState(0);
  useMotionValueEvent(spring, "change", (v) => setLstDeg(norm360(v)));

  const toNow = () => {
    const d = new Date();
    const target = lst(d, loc.lon);
    const cur = rot.get();
    rot.set(cur + (((target - norm360(cur) + 540) % 360) - 180));
  };
  useEffect(() => {
    if (!now) return;
    const t = setTimeout(() => rot.jump(lst(new Date(), loc.lon)), 0);
    return () => clearTimeout(t);
  }, [now === null, loc.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dragging rotates the disc around the pivot
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ a: number; r: number } | null>(null);
  const angleAt = (e: React.PointerEvent) => {
    const b = svg.current!.getBoundingClientRect();
    return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) / D2R;
  };

  // Static geometry
  const art = useMemo(() => {
    const placed = Object.fromEntries(STARS.map((st) => [st.id, pt(st.ra, st.dec)]));
    const lines = LINES.map(([a, b]) => `M${placed[a].x} ${placed[a].y}L${placed[b].x} ${placed[b].y}`).join("");
    const stars = STARS.filter((st) => rOf(st.dec) <= RC + 2);
    // Horizon window (alt = 0) in hour-angle / declination
    const win: string[] = [];
    for (let A = 0; A <= 360; A += 3) {
      const a = A * D2R, p = phi * D2R;
      const dec = Math.asin(Math.cos(p) * Math.cos(a)) / D2R;
      const H = Math.atan2(-Math.sin(a), -Math.sin(p) * Math.cos(a)) / D2R;
      const r = ((90 - dec) / (90 - decMin)) * RC;
      const b = H * s * D2R;
      win.push(`${r2(C + r * Math.sin(b))} ${r2(C + r * Math.cos(b))}`);
    }
    const windowPath = `M${win.join("L")}Z`;
    // Date ring ticks + labels
    const ticks: string[] = [];
    const labels: { x: number; y: number; a: number; t: string }[] = [];
    let doy = 0;
    for (let m = 0; m < 12; m++) {
      for (let d = 0; d < DAYS[m]; d++) {
        const b = -raMidnight(doy) * s * D2R;
        const big = d === 0 ? 14 : d % 5 === 0 ? 8 : 4;
        ticks.push(`M${r2(C + (RC + 6) * Math.sin(b))} ${r2(C + (RC + 6) * Math.cos(b))}L${r2(C + (RC + 6 + big) * Math.sin(b))} ${r2(C + (RC + 6 + big) * Math.cos(b))}`);
        if (d === 15) labels.push({ x: r2(C + (RC + 30) * Math.sin(b)), y: r2(C + (RC + 30) * Math.cos(b)), a: r2(180 - (b / D2R)), t: MONTHS[m] });
        doy++;
      }
    }
    // RA spokes and dec circles
    const spokes = Array.from({ length: 12 }, (_, i) => {
      const a = pt(i * 30, 90 * s), b = pt(i * 30, decMin);
      return `M${a.x} ${a.y}L${b.x} ${b.y}`;
    }).join("");
    const circles = [60, 30, 0, -30].filter((d) => s * d > decMin).map((d) => rOf(d * s));
    return { placed, lines, stars, windowPath, ticks: ticks.join(""), labels, spokes, circles };
  }, [loc.lat]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hour ring on the mask: local time T sits at screen angle T*15° from the bottom
  const hours = Array.from({ length: 24 }, (_, h) => {
    const b = h * 15 * s * D2R;
    return { h, x: r2(C + (RD + 20) * Math.sin(b)), y: r2(C + (RD + 20) * Math.cos(b)), t1: { x: r2(C + RD * Math.sin(b)), y: r2(C + RD * Math.cos(b)) }, t2: { x: r2(C + (RD + 7) * Math.sin(b)), y: r2(C + (RD + 7) * Math.cos(b)) } };
  });

  // What time does the current rotation mean, today?
  const reading = useMemo(() => {
    if (!now) return null;
    const start = Date.UTC(now.getUTCFullYear(), 0, 0);
    const doy = Math.floor((now.getTime() - start) / 86400000) - 1;
    const lmt = norm360(lstDeg - raMidnight(doy)) / 15; // local mean time, hours
    const zone = lmt - loc.lon / 15 + tzOffset(now, loc.tz) / 60;
    const z = ((zone % 24) + 24) % 24;
    const label = `${String(Math.floor(z)).padStart(2, "0")}:${String(Math.floor((z % 1) * 60)).padStart(2, "0")}`;
    return { label, date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: loc.tz }).format(now) };
  }, [lstDeg, now, loc.lon, loc.tz]);

  return (
    <section className="relative">
      <div data-bg="light" className="gut relative z-10 bg-paper pt-[18vh] text-ink">
        <h2 data-fit data-reveal="h" className="t-display -mb-[4.4vw] text-[14vw] leading-[0.8]">Planisphere</h2>
      </div>
      <div data-bg="dark" className="relative bg-night pb-[14vh] pt-[14vh] text-star">
        <div className="gut grid grid-cols-12 items-center gap-6 max-lg:grid-cols-1">
          <div className="col-span-4 col-start-2 max-lg:col-span-1 max-lg:col-start-1" data-reveal-group>
            <h3 data-reveal="h" className="t-display t-h5 max-w-[14ch]">The oldest sky app still fits in your hand</h3>
            <p data-reveal="p" className="t-body mt-6 max-w-[38ch] text-star/75">
              Long before phones, people found stars with a planisphere: a star disc that turns under a window shaped like the horizon. Luna&rsquo;s mark is one. This one works, drawn for {fmtLat(loc.lat)}. Drag the sky to turn it, then print one for your own latitude.
            </p>
            <div data-reveal="ctn" className="mt-10 flex flex-wrap items-end gap-8">
              <div>
                <p className="t-label text-star/60">{reading ? `On ${reading.date}, the sky at` : "Turn the disc"}</p>
                <p className="t-display tnum mt-2 text-[4.4vw] leading-none max-lg:text-[14vw]">{reading?.label ?? "--:--"}</p>
              </div>
              <button onClick={toNow} className="pill t-label">Back to now</button>
            </div>
          </div>
          <div className="col-span-6 col-start-7 max-lg:col-span-1 max-lg:col-start-1" data-reveal="ctn">
            <div className="relative mx-auto w-full max-w-[640px]">
              <svg
              ref={svg}
              viewBox="0 0 600 600"
              className="h-auto w-full cursor-grab touch-none select-none active:cursor-grabbing"
              role="img"
              aria-label={`Planisphere for latitude ${fmtLat(loc.lat)}. Drag to rotate the star disc.`}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                drag.current = { a: angleAt(e), r: rot.get() };
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                const d = angleAt(e) - drag.current.a;
                rot.set(drag.current.r - d * s);
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
            >
              <defs>
                <radialGradient id="ps-disc" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#13262a" />
                  <stop offset="1" stopColor="#0a1414" />
                </radialGradient>
                <linearGradient id="ps-plate" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1b2a28" />
                  <stop offset="0.5" stopColor="#101c1b" />
                  <stop offset="1" stopColor="#182624" />
                </linearGradient>
                <mask id="ps-window">
                  <rect width="600" height="600" fill="white" />
                  <path d={art.windowPath} fill="black" />
                </mask>
                <path id="ps-arc" d={`M ${C - 168} ${C} A 168 168 0 0 1 ${C + 168} ${C}`} />
              </defs>

              {/* Star disc */}
              <motion.g style={{ rotate: svgRot, originX: 0.5, originY: 0.5 }}>
                <circle cx={C} cy={C} r={RD} fill="url(#ps-disc)" stroke="#c9b98f" strokeOpacity=".5" />
                <circle cx={C} cy={C} r={RC + 4} fill="none" stroke="#c9b98f" strokeOpacity=".5" />
                <g stroke="#c9b98f" strokeOpacity=".14" fill="none">
                  <path d={art.spokes} />
                  {art.circles.map((r) => <circle key={r} cx={C} cy={C} r={r} />)}
                </g>
                <path d={art.lines} stroke="#c9b98f" strokeOpacity=".55" strokeWidth="1" fill="none" />
                {art.stars.map((st) => {
                  const p = art.placed[st.id];
                  return <circle key={st.id} cx={p.x} cy={p.y} r={Math.max(0.9, 3.4 - st.mag * 0.7)} fill="#f4ecdc" />;
                })}
                <path d={art.ticks} stroke="#c9b98f" strokeWidth=".8" />
                {art.labels.map((l) => (
                  <text key={l.t} x={l.x} y={l.y} transform={`rotate(${l.a} ${l.x} ${l.y})`} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="rgba(243,241,234,.72)" style={{ fontFamily: "var(--sans)", fontVariationSettings: '"wdth" 112' }}>{l.t}</text>
                ))}
                <text x={art.placed.polaris.x + 6} y={art.placed.polaris.y - 6} fontSize="10" fill="rgba(243,241,234,.5)">{s > 0 ? "Polaris" : ""}</text>
              </motion.g>

              {/* Mask with the horizon window */}
              <g mask="url(#ps-window)">
                <circle cx={C} cy={C} r={RC + 4} fill="url(#ps-plate)" />
                <circle cx={C} cy={C} r={RC + 4} fill="none" stroke="#c9b98f" strokeOpacity=".7" />
                <text fontSize="11" letterSpacing="4" fill="#c9b98f" style={{ fontFamily: "var(--sans)", fontVariationSettings: '"wdth" 112' }}>
                  <textPath href="#ps-arc" startOffset="50%" textAnchor="middle">LUNA · {fmtLat(loc.lat).toUpperCase()}</textPath>
                </text>
              </g>
              <path d={art.windowPath} fill="none" stroke="var(--star)" strokeOpacity=".7" strokeWidth="1.2" />
              {/* Hour ring */}
              {hours.map((h) => (
                <g key={h.h}>
                  <line x1={h.t1.x} y1={h.t1.y} x2={h.t2.x} y2={h.t2.y} stroke="#c9b98f" />
                  {h.h % 2 === 0 && (
                    <text x={h.x} y={h.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={h.h === 0 ? "#ff7a62" : "rgba(243,241,234,.5)"} style={{ fontFamily: "var(--sans)", fontVariationSettings: '"wdth" 112' }}>
                      {String(h.h).padStart(2, "0")}
                    </text>
                  )}
                </g>
              ))}
              <circle cx={C} cy={C} r="5" fill="var(--night)" stroke="#c9b98f" />
              <path d="M300 296.6c.2 1.6.7 2.4 2.8 2.8-2.1.4-2.6 1.2-2.8 2.8-.2-1.6-.7-2.4-2.8-2.8 2.1-.4 2.6-1.2 2.8-2.8z" fill="var(--torch)" />
            </svg>
              <p className="t-label mt-4 text-center text-star/50">Drawn for {fmtLat(loc.lat)} · the pivot is the north celestial pole, beside Polaris</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
