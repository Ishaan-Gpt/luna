import { rng } from "@/lib/sky";

/**
 * Layered Himalayan ridgelines, drawn procedurally and deterministically
 * (rounded coordinates, so server and client markup match).
 */
function ridgePath(seed: number, w: number, h: number, base: number, amp: number, rough: number) {
  const r = rng(seed);
  const pts: [number, number][] = [];
  const n = 48;
  let y = base;
  const peaks = Array.from({ length: 4 }, () => ({ x: r() * w, a: amp * (0.5 + r() * 0.8), s: w * (0.08 + r() * 0.14) }));
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w;
    let lift = 0;
    for (const p of peaks) lift += p.a * Math.exp(-(((x - p.x) / p.s) ** 2));
    y = base - lift + (r() - 0.5) * rough;
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  return `M0 ${h} L${pts.map(([x, yy]) => `${x} ${yy}`).join(" L")} L${w} ${h}Z`;
}

export function Ridge({ className = "", tone = "night" }: { className?: string; tone?: "night" | "dawn" }) {
  const w = 1600;
  const h = 420;
  const layers =
    tone === "dawn"
      ? [
          { seed: 3, base: 250, amp: 150, rough: 14, fill: "#8a6f78", o: 0.55 },
          { seed: 9, base: 300, amp: 120, rough: 12, fill: "#4d3f4a", o: 0.85 },
          { seed: 21, base: 350, amp: 80, rough: 10, fill: "#241d24", o: 1 },
          { seed: 33, base: 395, amp: 40, rough: 6, fill: "#110d12", o: 1 },
        ]
      : [
          { seed: 3, base: 250, amp: 150, rough: 14, fill: "#1d302d", o: 0.7 },
          { seed: 9, base: 300, amp: 120, rough: 12, fill: "#132321", o: 0.9 },
          { seed: 21, base: 350, amp: 80, rough: 10, fill: "#0b1615", o: 1 },
          { seed: 33, base: 395, amp: 40, rough: 6, fill: "#060c0c", o: 1 },
        ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`snow-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone === "dawn" ? "#f3d6cf" : "#9fb3aa"} stopOpacity="0.35" />
          <stop offset="0.25" stopColor={tone === "dawn" ? "#f3d6cf" : "#9fb3aa"} stopOpacity="0" />
        </linearGradient>
      </defs>
      {layers.map((l, i) => (
        <g key={i}>
          <path d={ridgePath(l.seed, w, h, l.base, l.amp, l.rough)} fill={l.fill} opacity={l.o} />
          {i === 0 && <path d={ridgePath(l.seed, w, h, l.base, l.amp, l.rough)} fill={`url(#snow-${tone})`} />}
        </g>
      ))}
    </svg>
  );
}
