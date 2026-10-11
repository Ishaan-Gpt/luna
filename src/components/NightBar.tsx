"use client";

import { fmtTime, type Loc, type Night } from "@/lib/sky";
import { barColor } from "@/lib/draw";

type Props = {
  night: Night | null;
  loc: Loc;
  cursor?: Date | null;
  clouds?: { t: Date; cloud: number }[] | null;
  compact?: boolean;
};

/**
 * Tonight from sunset to sunrise. The band is coloured by the real Sun altitude,
 * the thin lane below shows when the Moon is up, the torch bracket is the best window.
 */
export function NightBar({ night, loc, cursor, clouds, compact = false }: Props) {
  if (!night) return <div className="skeleton h-24 w-full" />;
  const t0 = night.sunset.getTime();
  const t1 = night.sunrise.getTime();
  const x = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - t0) / (t1 - t0)) * 100));
  const mid = (t0 + t1) / 2;
  const stops = night.samples.map((s, i) => {
    return <stop key={i} offset={`${(i / (night.samples.length - 1)) * 100}%`} stopColor={barColor(s.sun, s.t.getTime() > mid)} />;
  });

  // Moon lanes
  const lanes: { a: number; b: number }[] = [];
  let open: number | null = null;
  night.samples.forEach((s, i) => {
    const pos = (i / (night.samples.length - 1)) * 100;
    if (s.moon > 0 && open === null) open = pos;
    if ((s.moon <= 0 || i === night.samples.length - 1) && open !== null) {
      lanes.push({ a: open, b: pos });
      open = null;
    }
  });

  // Hour ticks
  const ticks: { pos: number; label: string }[] = [];
  const first = new Date(Math.ceil(t0 / 3600000) * 3600000);
  for (let t = first.getTime(); t < t1; t += 3600000) {
    ticks.push({ pos: x(new Date(t)), label: fmtTime(new Date(t), loc.tz).slice(0, 2) });
  }

  const cloudBars = (clouds ?? []).filter((c) => c.t.getTime() >= t0 && c.t.getTime() <= t1);
  const id = `nb-${compact ? "c" : "f"}`;

  return (
    <div className="w-full select-none">
      <div className="relative">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className={`block w-full ${compact ? "h-10" : "h-14"} rounded-xl`}>
          <defs>
            <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">{stops}</linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="10" rx="1.6" fill={`url(#${id})`} />
        </svg>
        {/* best window bracket */}
        {night.best && (
          <div
            className="absolute -top-1.5 bottom-[-6px] rounded-lg border border-torch/80 shadow-[0_0_24px_-6px_rgba(229,83,61,.8)]"
            style={{ left: `${x(night.best.start)}%`, width: `${x(night.best.end) - x(night.best.start)}%` }}
          >
            <span className="t-label !tracking-[0.08em] absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.66rem] text-torch">best window</span>
          </div>
        )}
        {cursor && (
          <div className="absolute -top-2 -bottom-2 w-px bg-star shadow-[0_0_12px_rgba(242,234,219,.8)]" style={{ left: `${x(cursor)}%` }}>
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-star" />
          </div>
        )}
      </div>

      {/* moon lane */}
      <div className="relative mt-3 h-1.5 rounded-full bg-white/5">
        {lanes.map((l, i) => (
          <div key={i} className="absolute inset-y-0 rounded-full bg-[#f4ecdc]/70" style={{ left: `${l.a}%`, width: `${l.b - l.a}%` }} />
        ))}
      </div>
      {!compact && cloudBars.length > 0 && (
        <div className="relative mt-2 h-5">
          {cloudBars.map((c, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-[3px] -translate-x-1/2 rounded-full bg-star/50"
              style={{ left: `${x(c.t)}%`, height: `${Math.max(8, c.cloud)}%`, opacity: 0.3 + c.cloud / 160 }}
              title={`${c.cloud}% cloud`}
            />
          ))}
        </div>
      )}
      <div className="relative mt-2 h-4">
        {ticks.map((t, i) => (
          <span key={i} className="t-label !tracking-[0.08em] absolute -translate-x-1/2 text-[0.62rem] text-star/50" style={{ left: `${t.pos}%` }}>
            {t.label}
          </span>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.75rem] text-star/50">
          <span className="flex items-center gap-2"><i className="h-1.5 w-4 rounded-full bg-[#f4ecdc]/70" /> Moon above horizon</span>
          {cloudBars.length > 0 && <span className="flex items-center gap-2"><i className="h-3 w-[3px] rounded-full bg-star/50" /> Cloud cover by hour</span>}
          <span className="flex items-center gap-2"><i className="h-3 w-4 rounded border border-torch" /> Darkest, moon-free stretch</span>
        </div>
      )}
    </div>
  );
}
