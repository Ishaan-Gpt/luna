import type { CSSProperties, ReactNode, SVGProps } from "react";
import { rng } from "@/lib/sky";

const r2 = (n: number) => Math.round(n * 100) / 100;

/* ---------- glyphs: one thin hand, 1px strokes ---------- */
type G = SVGProps<SVGSVGElement> & { size?: number };
const g = ({ size = 18, ...p }: G) => ({ width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const ArrowLeft = (p: G) => (
  <svg viewBox="0 0 24 24" {...g(p)}>
    <path d="M21 12.2c-6-.4-11.4-.3-17.4 0" />
    <path d="m8.6 7-5 5.2 5 5" />
  </svg>
);
export const ArrowRight = (p: G) => (
  <svg viewBox="0 0 24 24" {...g(p)}>
    <path d="M3 12.2c6-.4 11.4-.3 17.4 0" />
    <path d="m15.4 7 5 5.2-5 5" />
  </svg>
);
export const ArrowUp = (p: G) => (
  <svg viewBox="0 0 24 24" {...g(p)}>
    <path d="M12.2 21c-.4-6-.3-11.4 0-17.4" />
    <path d="m7 8.6 5.2-5 5 5" />
  </svg>
);
export const Plus = (p: G) => (
  <svg viewBox="0 0 24 24" {...g(p)}>
    <path d="M12 4v16M4 12h16" />
  </svg>
);
/** Four-point star, the Luna spark. */
export const Spark = ({ size = 18, ...p }: G) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M12 1.5c.6 5.6 2.4 8.4 10.5 10.5-8.1 2.1-9.9 4.9-10.5 10.5-.6-5.6-2.4-8.4-10.5-10.5 8.1-2.1 9.9-4.9 10.5-10.5z" fill="currentColor" />
  </svg>
);
export const QuoteMark = ({ size = 34, ...p }: G) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 40 24" aria-hidden {...p}>
    <path d="M2 22c0-9 4-16 12-20l1.4 2C11 7 9.4 10.6 9.6 14H16v8H2zm20 0c0-9 4-16 12-20l1.4 2C31 7 29.4 10.6 29.6 14H36v8H22z" fill="currentColor" />
  </svg>
);

/* ---------- the planisphere mark ---------- */
export function Mark({ size = 40, className = "", spark = "var(--torch)" }: { size?: number; className?: string; spark?: string }) {
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r1 = 14.2;
    const rr = i % 6 === 0 ? 12.2 : 13.2;
    return `M${r2(16 + Math.sin(a) * r1)} ${r2(16 - Math.cos(a) * r1)}L${r2(16 + Math.sin(a) * rr)} ${r2(16 - Math.cos(a) * rr)}`;
  }).join("");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth=".8" />
      <path d={ticks} stroke="currentColor" strokeWidth=".6" strokeLinecap="round" />
      <ellipse cx="16" cy="14.4" rx="8" ry="6.4" stroke="currentColor" strokeWidth="1" />
      <path d="M16 9.9c.3 2.5 1.1 3.8 4.4 4.5-3.3.7-4.1 2-4.4 4.5-.3-2.5-1.1-3.8-4.4-4.5 3.3-.7 4.1-2 4.4-4.5z" fill={spark} />
    </svg>
  );
}

/* ---------- text on a circle ---------- */
export function CircleText({ text, size = 120, inset = 10, className = "", style, fontSize = 8.6 }: { text: string; size?: number; inset?: number; className?: string; style?: CSSProperties; fontSize?: number }) {
  const r = 50 - inset;
  const id = `ct-${text.replace(/[^a-z]/gi, "").slice(0, 10)}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className={className} style={style}>
      <defs>
        <path id={id} d={`M50 50 m-${r} 0 a${r} ${r} 0 1 1 ${r * 2} 0 a${r} ${r} 0 1 1 -${r * 2} 0`} />
      </defs>
      <text fill="currentColor" fontSize={fontSize} letterSpacing="2.6" style={{ fontFamily: "var(--sans)", fontVariationSettings: '"wdth" 125', fontWeight: 700, textTransform: "uppercase" }}>
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
    </svg>
  );
}

/** The header emblem: the mark inside a slowly turning ring of words. */
export function Emblem({ size = 84 }: { size?: number }) {
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <span data-emblem-ring className="absolute inset-0">
        <CircleText text="Luna · night sky guide · works offline · " size={size} inset={6} fontSize={9.2} />
      </span>
      <Mark size={size * 0.42} />
    </span>
  );
}

/* ---------- circular call to action ---------- */
export function CircleButton({ href, children, size = 168, className = "", tone = "ink" }: { href: string; children: ReactNode; size?: number; className?: string; tone?: "ink" | "star" }) {
  const c = 2 * Math.PI * 47;
  return (
    <a href={href} data-magnetic className={`cbtn group relative inline-grid place-items-center rounded-full ${tone === "star" ? "text-star" : "text-ink"} ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth=".5" />
        <g className="cbtn-arcs" style={{ transformOrigin: "50px 50px" }}>
          <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth=".9" className="cbtn-arc" style={{ strokeDasharray: `${c * 0.045} ${c}` }} />
          <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth=".9" className="cbtn-arc" style={{ strokeDasharray: `${c * 0.045} ${c}`, transform: "rotate(180deg)", transformOrigin: "50px 50px" }} />
        </g>
      </svg>
      <span data-magnetic-inner className="t-label relative max-w-[70%] text-center leading-[1.6]">{children}</span>
      <style>{`
        .cbtn .cbtn-arcs { animation: spin 24s linear infinite; }
        .cbtn .cbtn-arc { transition: stroke-dasharray .8s var(--ease-inout); }
        .cbtn:hover .cbtn-arc { stroke-dasharray: ${c / 2} ${c} !important; }
      `}</style>
    </a>
  );
}

/* ---------- moonflowers: night-blooming white trumpets on a heart-leaf vine ---------- */
function bloomPath(R: number) {
  const pts: string[] = [];
  for (let k = 0; k < 5; k++) {
    const a0 = ((k * 72 - 90) * Math.PI) / 180;
    const a1 = (((k + 1) * 72 - 90) * Math.PI) / 180;
    const am = (a0 + a1) / 2;
    const p0 = [Math.cos(a0) * R * 0.96, Math.sin(a0) * R * 0.96];
    const p1 = [Math.cos(a1) * R * 0.96, Math.sin(a1) * R * 0.96];
    const c = [Math.cos(am) * R * 1.13, Math.sin(am) * R * 1.13];
    if (k === 0) pts.push(`M${r2(p0[0])} ${r2(p0[1])}`);
    pts.push(`Q${r2(c[0])} ${r2(c[1])} ${r2(p1[0])} ${r2(p1[1])}`);
  }
  return pts.join("") + "Z";
}
function starPath(R: number, inner = 0.34) {
  let d = "";
  for (let k = 0; k < 10; k++) {
    const a = ((k * 36 - 90) * Math.PI) / 180;
    const rr = k % 2 === 0 ? R : R * inner;
    d += `${k ? "L" : "M"}${r2(Math.cos(a) * rr)} ${r2(Math.sin(a) * rr)}`;
  }
  return d + "Z";
}
const HEART = "M0 0C-6-2-9.5-9-4.6-12.6C-2-14.6 0-13.2 0-11.2C0-13.2 2-14.6 4.6-12.6C9.5-9 6-2 0 0Z";

type Bloom = { x: number; y: number; r: number; rot: number; tilt?: number };
export function Moonflowers({ seed = 1, className = "", style, tone = "light", blooms, vine, leaves = 14 }: {
  seed?: number; className?: string; style?: CSSProperties; tone?: "light" | "dark";
  blooms: Bloom[]; vine: string; leaves?: number;
}) {
  const r = rng(seed);
  const leafA = tone === "dark" ? "#16261f" : "#2b4a3a";
  const leafB = tone === "dark" ? "#1e3329" : "#3a5d48";
  // leaves are scattered along a few anchor points derived from the blooms and the seed
  const L = Array.from({ length: leaves }, (_, i) => {
    const b = blooms[i % blooms.length];
    const ang = r() * Math.PI * 2;
    const dist = b.r * (1.2 + r() * 1.6);
    return { x: r2(b.x + Math.cos(ang) * dist), y: r2(b.y + Math.sin(ang) * dist), s: r2(b.r / 11 * (0.7 + r() * 0.6)), rot: r2((ang * 180) / Math.PI + 90 + (r() - 0.5) * 40), c: r() < 0.5 ? leafA : leafB };
  });
  const id = `mf${seed}`;
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id={`${id}-p`} cx="50%" cy="50%" r="55%">
          <stop offset="0" stopColor="#fbfbf3" />
          <stop offset=".72" stopColor="#f4f5ec" />
          <stop offset="1" stopColor={tone === "dark" ? "#c9d2c6" : "#dfe4d6"} />
        </radialGradient>
        <radialGradient id={`${id}-t`}>
          <stop offset="0" stopColor="#dfe6b2" />
          <stop offset="1" stopColor="#f6f7ea" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor="#f8f6e8" stopOpacity=".55" />
          <stop offset="1" stopColor="#f8f6e8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={vine} fill="none" stroke={leafA} strokeWidth="2.2" strokeLinecap="round" />
      {L.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.s})`}>
          <path d={HEART} fill={l.c} />
          <path d="M0 0L0-11" stroke={tone === "dark" ? "#2c4538" : "#4f7660"} strokeWidth=".6" />
        </g>
      ))}
      {blooms.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.rot}) scale(1 ${b.tilt ?? 1})`}>
          {tone === "dark" && <circle r={b.r * 1.9} fill={`url(#${id}-g)`} />}
          <path d={bloomPath(b.r)} fill={`url(#${id}-p)`} />
          <path d={starPath(b.r * 0.92)} fill="#ffffff" opacity=".55" />
          {Array.from({ length: 5 }, (_, k) => {
            const a = ((k * 72 - 90) * Math.PI) / 180;
            return <path key={k} d={`M0 0L${r2(Math.cos(a) * b.r * 0.94)} ${r2(Math.sin(a) * b.r * 0.94)}`} stroke="#dfe5d3" strokeWidth={r2(b.r * 0.025)} />;
          })}
          <circle r={b.r * 0.32} fill={`url(#${id}-t)`} />
          <circle r={b.r * 0.06} fill="#e7e0b0" />
        </g>
      ))}
    </svg>
  );
}

/** Two ready-made vines used at section corners. */
export function VineA(props: { className?: string; style?: CSSProperties; tone?: "light" | "dark" }) {
  return (
    <Moonflowers
      seed={3}
      {...props}
      vine="M-10 40 C 80 60 120 140 210 150 S 330 240 360 330"
      blooms={[
        { x: 120, y: 110, r: 46, rot: 8 },
        { x: 236, y: 178, r: 38, rot: -14, tilt: 0.86 },
        { x: 70, y: 210, r: 30, rot: 22, tilt: 0.7 },
        { x: 330, y: 290, r: 26, rot: 4, tilt: 0.8 },
      ]}
      leaves={18}
    />
  );
}
export function VineB(props: { className?: string; style?: CSSProperties; tone?: "light" | "dark" }) {
  return (
    <Moonflowers
      seed={9}
      {...props}
      vine="M410 360 C 330 340 300 260 220 250 S 90 170 40 60"
      blooms={[
        { x: 260, y: 270, r: 50, rot: -6 },
        { x: 150, y: 200, r: 34, rot: 16, tilt: 0.82 },
        { x: 330, y: 180, r: 28, rot: -20, tilt: 0.74 },
      ]}
      leaves={16}
    />
  );
}
