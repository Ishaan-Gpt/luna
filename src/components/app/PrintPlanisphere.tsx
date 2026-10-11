"use client";

import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { fmtLat, norm360 } from "@/lib/sky";
import { Mark } from "../landing/primitives";

const D2R = Math.PI / 180;
const C = 300;
const RC = 200; // chart radius on the disc
const RM = 222; // mask radius (hours printed just inside its edge)
const RD = 262; // disc radius (dates on the rim, outside the mask)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const r2 = (n: number) => Math.round(n * 100) / 100;
const raMidnight = (doy: number) => norm360((doy - 80) * (360 / 365.25) + 180);

/**
 * A two-piece paper planisphere for one latitude. Print, cut out both circles, cut the window,
 * pin the centres together. Line up today's date with the time to see tonight's sky.
 */
export function PrintPlanisphere() {
  const cat = useCatalog();
  const [lat, setLat] = useState<number | null>(null);
  const [name, setName] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const l = parseFloat(p.get("lat") ?? "32.78");
    setTimeout(() => {
      setLat(Number.isFinite(l) ? Math.max(-80, Math.min(80, l)) : 32.78);
      setName(p.get("name") ?? "");
    }, 0);
  }, []);

  const art = useMemo(() => {
    if (lat === null || !cat) return null;
    const s = lat >= 0 ? 1 : -1;
    const phi = Math.max(10, Math.abs(lat));
    const decMin = phi - 90 - 2;
    const rOf = (dec: number) => ((90 - s * dec) / (90 - decMin)) * RC;
    const pt = (ra: number, dec: number) => {
      const b = -ra * s * D2R;
      const r = rOf(dec);
      return { x: r2(C + r * Math.sin(b)), y: r2(C + r * Math.cos(b)), r };
    };
    const stars = cat.stars.filter(([, dec, mag]) => mag <= 4.8 && rOf(dec) <= RC).map(([ra, dec, mag]) => ({ ...pt(ra, dec), mag }));
    const lines: string[] = [];
    for (const segs of Object.values(cat.lines)) {
      for (const seg of segs) {
        const pts = seg.map(([ra, dec]) => pt(ra, dec));
        if (pts.some((p) => p.r > RC)) continue;
        lines.push(`M${pts.map((p) => `${p.x} ${p.y}`).join("L")}`);
      }
    }
    const names = Object.entries(cat.names)
      .map(([hip, v]) => ({ v, st: cat.stars.find((x) => x[4] === Number(hip)) }))
      .filter((x) => x.st && x.st[2] < 1.6 && !x.v.n.includes(" "))
      .map((x) => ({ n: x.v.n, ...pt(x.st![0], x.st![1]) }))
      .filter((x) => x.r <= RC - 6);
    const win: string[] = [];
    for (let A = 0; A <= 360; A += 2) {
      const a = A * D2R, p = phi * D2R;
      const dec = Math.asin(Math.cos(p) * Math.cos(a)) / D2R;
      const H = Math.atan2(-Math.sin(a), -Math.sin(p) * Math.cos(a)) / D2R;
      const r = ((90 - dec) / (90 - decMin)) * RC;
      const b = H * s * D2R;
      win.push(`${r2(C + r * Math.sin(b))} ${r2(C + r * Math.cos(b))}`);
    }
    const ticks: string[] = [];
    const months: { x: number; y: number; a: number; t: string }[] = [];
    let doy = 0;
    for (let m = 0; m < 12; m++) {
      for (let d = 0; d < DAYS[m]; d++) {
        const b = -raMidnight(doy) * s * D2R;
        const len = d === 0 ? 16 : d % 5 === 0 ? 9 : 5;
        ticks.push(`M${r2(C + (RM + 4) * Math.sin(b))} ${r2(C + (RM + 4) * Math.cos(b))}L${r2(C + (RM + 4 + len) * Math.sin(b))} ${r2(C + (RM + 4 + len) * Math.cos(b))}`);
        if (d === 15) months.push({ x: r2(C + (RM + 30) * Math.sin(b)), y: r2(C + (RM + 30) * Math.cos(b)), a: r2(180 - b / D2R), t: MONTHS[m] });
        doy++;
      }
    }
    const hours = Array.from({ length: 24 }, (_, h) => {
      const b = h * 15 * s * D2R;
      return { h, x: r2(C + (RM - 12) * Math.sin(b)), y: r2(C + (RM - 12) * Math.cos(b)), t1: `${r2(C + RM * Math.sin(b))} ${r2(C + RM * Math.cos(b))}`, t2: `${r2(C + (RM - 5) * Math.sin(b))} ${r2(C + (RM - 5) * Math.cos(b))}` };
    });
    return { stars, lines: lines.join(""), names, windowPath: `M${win.join("L")}Z`, ticks: ticks.join(""), months, hours, s };
  }, [lat, cat]);

  if (!art || lat === null) return <p className="p-10 text-center">Preparing your planisphere…</p>;

  return (
    <div className="min-h-screen bg-white px-6 py-10 text-black print:p-0">
      <style>{`@page { size: A4 portrait; margin: 12mm } @media print { .noprint { display: none !important } .piece { break-after: page; } }`}</style>
      <div className="noprint mx-auto mb-10 max-w-[760px]">
        <div className="flex items-center gap-2 text-[#0e1a1f]"><Mark size={34} spark="#e5533d" /><span className="t-display text-[28px]">Luna</span></div>
        <h1 className="t-display mt-6 text-[56px] leading-[0.9]">A planisphere for {fmtLat(lat)}</h1>
        <p className="t-body mt-4 max-w-[60ch] text-black/70">
          Print both pages at 100% scale. Cut out the star disc and the mask, then cut out the oval window in the mask. Push a split pin through both centres, mask on top. Turn the disc until today&rsquo;s date lines up with the time, and the window shows the sky you&rsquo;ll see, with south at the bottom{art.s < 0 ? " (north at the bottom in the southern hemisphere)" : ""}. Times are local solar time, within about half an hour of clock time.
        </p>
        <button onClick={() => window.print()} className="t-label mt-6 rounded-full border border-black px-6 py-3 hover:bg-black hover:text-white">Print</button>
      </div>

      <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-2 print:block">
        <figure className="piece flex flex-col items-center">
          <svg viewBox="0 0 600 600" className="w-full max-w-[180mm]" aria-label="Star disc">
            <circle cx={C} cy={C} r={RD} fill="#fff" stroke="#000" strokeWidth="1" strokeDasharray="4 3" />
            <circle cx={C} cy={C} r={RC} fill="none" stroke="#000" strokeWidth=".6" />
            <path d={art.lines} stroke="#777" strokeWidth=".55" fill="none" />
            {art.stars.map((st, i) => <circle key={i} cx={st.x} cy={st.y} r={Math.max(0.6, 3.1 - st.mag * 0.55)} fill="#000" />)}
            {art.names.map((n) => <text key={n.n} x={n.x + 4} y={n.y - 4} fontSize="7" fill="#333">{n.n}</text>)}
            <path d={art.ticks} stroke="#000" strokeWidth=".7" />
            {art.months.map((m) => <text key={m.t} x={m.x} y={m.y} transform={`rotate(${m.a} ${m.x} ${m.y})`} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#000">{m.t}</text>)}
            <circle cx={C} cy={C} r="2" fill="#000" />
          </svg>
          <figcaption className="t-label mt-3 text-black/60">Star disc · cut on the dashed circle</figcaption>
        </figure>

        <figure className="piece flex flex-col items-center">
          <svg viewBox="0 0 600 600" className="w-full max-w-[180mm]" aria-label="Mask with horizon window">
            <circle cx={C} cy={C} r={RM} fill="#eceae3" stroke="#000" strokeWidth="1" strokeDasharray="4 3" />
            <path d={art.windowPath} fill="#fff" stroke="#000" strokeWidth="1" strokeDasharray="5 3" />
            {art.hours.map((h) => (
              <g key={h.h}>
                <path d={`M${h.t1}L${h.t2}`} stroke="#000" strokeWidth=".8" />
                <text x={h.x} y={h.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={h.h === 0 ? "#c2412c" : "#000"}>{String(h.h).padStart(2, "0")}</text>
              </g>
            ))}
            <text x={C} y={C + (art.s > 0 ? 196 : -190)} textAnchor="middle" fontSize="9" fill="#000">{art.s > 0 ? "SOUTH" : "NORTH"}</text>
            <text x={C} y={C - 150} textAnchor="middle" fontSize="10" letterSpacing="3" fill="#000">LUNA · {fmtLat(lat).toUpperCase()}{name ? ` · ${name.toUpperCase()}` : ""}</text>
            <circle cx={C} cy={C} r="2" fill="#000" />
          </svg>
          <figcaption className="t-label mt-3 text-black/60">Mask · cut the outer circle and the window</figcaption>
        </figure>
      </div>
      <p className="t-label mx-auto mt-10 max-w-[760px] text-black/50">Stars from the Hipparcos catalogue via d3-celestial (BSD-3-Clause). Drawn by Luna for latitude {lat.toFixed(2)}°.</p>
    </div>
  );
}
