import type { SVGProps } from "react";

/*
 * Nebua's own icon set. Drawn by hand on a 24 grid: 1.4 stroke, round caps, currentColor.
 * Each glyph has one small quirk (an open ring, a bent shaft, a star that sparks) so the set reads as drawn.
 */
type P = SVGProps<SVGSVGElement> & { active?: boolean; size?: number };

const base = ({ size = 20, active: _a, ...p }: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

/** Four-point star; filled when marked. */
export const IconStar = ({ active, ...p }: P) => (
  <svg {...base(p)}>
    <path
      d="M12 3.2c.5 4.6 1.9 6.9 8.8 8.8-6.9 1.9-8.3 4.2-8.8 8.8-.5-4.6-1.9-6.9-8.8-8.8 6.9-1.9 8.3-4.2 8.8-8.8z"
      fill={active ? "currentColor" : "none"}
      style={{ transition: "fill .3s" }}
    />
    <path d="M18.6 4.2v2.2M17.5 5.3h2.2" />
  </svg>
);

/** Compass whose needle is a slim, slightly bent lozenge. */
export const IconCompass = (p: P) => (
  <svg {...base(p)}>
    <path d="M18.4 5.4A9 9 0 1 0 20.9 11" />
    <path d="m14.9 8.9-1.6 4.6-4.4 1.8 1.7-4.7z" />
    <circle cx="12" cy="12" r=".6" fill="currentColor" />
  </svg>
);

export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M19.6 14.6A8 8 0 0 1 9.3 4.3a8.2 8.2 0 1 0 10.3 10.3z" />
    <path d="M15.5 6.2h.01M18 9.3h.01" strokeWidth={2} />
  </svg>
);

export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.8" />
    <path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M5.9 18.1l1.4-1.4M16.7 7.3l1.3-1.2" />
  </svg>
);

/** Signal bars with the last two hollow and a soft cross-out. */
export const IconNoSignal = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 19v-2.4M8.5 19v-5.2" />
    <path d="M12.5 19v-8M16.5 19V8" strokeDasharray="1.4 2.2" />
    <path d="M3.6 6.2c5.8 3.1 11.2 8.2 16 13.4" />
  </svg>
);

export const IconSatellite = (p: P) => (
  <svg {...base(p)}>
    <path d="m9.3 9.4 4.2-4.2 5.3 5.3-4.2 4.2z" />
    <path d="m6.9 7-2.6 2.6 2.4 2.4L9.3 9.4M16.9 17l2.6-2.6-2.4-2.4" />
    <path d="M5.6 15.4a3.6 3.6 0 0 0 3 3M4 15.6a5.6 5.6 0 0 0 4.4 4.4" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20.6s6.2-5.4 6.2-10.6a6.2 6.2 0 0 0-12.4 0c0 5.2 6.2 10.6 6.2 10.6z" />
    <path d="M12 7.6l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z" fill="currentColor" strokeWidth={0.6} />
  </svg>
);

export const IconRoute = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="18" r="2" />
    <path d="M8 18h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16" />
    <path d="m18.8 3.6.5 1.6 1.6.5-1.6.5-.5 1.6-.5-1.6-1.6-.5 1.6-.5z" fill="currentColor" strokeWidth={0.6} />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.4 16.6V11a5.6 5.6 0 0 1 11.2 0v5.6l1.4 1.6H5z" />
    <path d="M10.2 20.4a2 2 0 0 0 3.6 0" />
    <path d="M17.8 3.4c1.3.7 2.3 1.8 2.8 3.2" />
  </svg>
);

/** Quill, for nicknames. The nib ends in a tiny spark. */
export const IconQuill = (p: P) => (
  <svg {...base(p)}>
    <path d="M19.8 4.2c-7 .6-11.2 5-12.6 12.4l1.6-1c4.4-.4 7.6-2.4 8.8-5.8l-2.2.2 3-2c.7-1.2 1.2-2.4 1.4-3.8z" />
    <path d="M7.2 16.6 4.6 19.4" />
    <path d="M4 15.2v1.4M3.3 15.9h1.4" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.4" width="16" height="14.6" rx="2.6" />
    <path d="M8.4 3.6v3.4M15.6 3.6v3.4M4 10h16" />
    <path d="m12 12.8.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" fill="currentColor" strokeWidth={0.6} />
  </svg>
);

export const IconMeteor = (p: P) => (
  <svg {...base(p)}>
    <circle cx="16.4" cy="16.4" r="3.2" />
    <path d="M14 13.8 4.4 4.2M12.2 16.8 6.6 11.2M17 12 11.6 6.6" />
  </svg>
);

export const IconEclipse = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="6.2" />
    <path d="M14.6 6.6a6.2 6.2 0 0 1 0 10.8 6.2 6.2 0 0 0 0-10.8z" fill="currentColor" />
    <path d="M12 2.8v1.4M12 19.8v1.4M2.8 12h1.4M19.8 12h1.4" />
  </svg>
);

export const IconSeason = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7.6" />
    <path d="M6.4 6.8c3.4 2 7.6 8.2 11.2 10.4" />
    <path d="M8 19.2c1.2-5.4 2.2-10.6 8-14.4" strokeDasharray="1.2 2.4" />
  </svg>
);

/** Crosshair with a gap at the top right, for "use my location". */
export const IconLocate = (p: P) => (
  <svg {...base(p)}>
    <path d="M15.6 5.2A7.4 7.4 0 1 0 19.2 10" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2" />
  </svg>
);

/** Arrow with a softly curved shaft. */
export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.2c4.6-.4 9.5-.3 14.6 0" />
    <path d="m13.8 6.6 5.4 5.6-5.4 5.4" />
  </svg>
);

export const IconArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M12.2 4.5c-.4 4.6-.3 9.5 0 14.6" />
    <path d="m6.6 13.8 5.6 5.4 5.4-5.4" />
  </svg>
);

export const IconCloud = (p: P) => (
  <svg {...base(p)}>
    <path d="M7.2 18.4h10a3.6 3.6 0 0 0 .4-7.2 5.6 5.6 0 0 0-10.8 1.2 3 3 0 0 0 .4 6z" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <path d="M18.3 5.6A8.6 8.6 0 1 0 20.6 12" />
    <path d="M12 7.4V12l3.2 2" />
  </svg>
);

export const IconTelescope = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.2 12.4 11.6-6.6 1.8 3.2L6 15.6z" />
    <path d="m17.6 5 1.4-.8 1.8 3.2-1.4.8M10.6 13.6l-3 7M11.6 13.2l3 7.4" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M17.6 4.9A9 9 0 1 0 20.6 9.4" />
    <path d="m8 12.3 2.7 2.6L20.4 5" />
  </svg>
);

export const IconExternal = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 4.6h6.4V11" />
    <path d="M19.2 4.8c-3.8 3.6-6.6 6.4-9 9" />
    <path d="M17 14.6v3a2 2 0 0 1-2 2H6.4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3" />
  </svg>
);
