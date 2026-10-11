"use client";

import { useEffect, type ReactNode, type SVGProps } from "react";

/* ---------- glyphs, in the same thin hand as the landing ---------- */
type G = SVGProps<SVGSVGElement> & { size?: number; active?: boolean };
const g = ({ size = 22, ...rest }: G) => {
  const p = { ...rest };
  delete p.active;
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p };
};

export const GSky = (p: G) => (
  <svg {...g(p)}>
    <circle cx="12" cy="12" r="9.2" />
    <ellipse cx="12" cy="11" rx="5.4" ry="4.2" />
    <path d="M12 8.4c.2 1.5.6 2.2 2.4 2.6-1.8.4-2.2 1.1-2.4 2.6-.2-1.5-.6-2.2-2.4-2.6 1.8-.4 2.2-1.1 2.4-2.6z" fill="currentColor" stroke="none" />
  </svg>
);
export const GTonight = (p: G) => (
  <svg {...g(p)}>
    <path d="M15.6 4.6a6.6 6.6 0 1 0 4.2 9.6 5.4 5.4 0 0 1-4.2-9.6z" />
    <path d="M2.8 19.6h18.4" />
  </svg>
);
export const GAsk = (p: G) => (
  <svg {...g(p)}>
    <path d="M4 5.6h16v10.2h-9.4L6 19.6v-3.8H4z" />
    <path d="M12 7.6c.2 1.2.6 1.8 2 2.1-1.4.3-1.8.9-2 2.1-.2-1.2-.6-1.8-2-2.1 1.4-.3 1.8-.9 2-2.1z" fill="currentColor" stroke="none" />
  </svg>
);
export const GPlaces = (p: G) => (
  <svg {...g(p)}>
    <path d="M12 21s6.4-5.6 6.4-11a6.4 6.4 0 0 0-12.8 0c0 5.4 6.4 11 6.4 11z" />
    <path d="M12 7.2l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z" fill="currentColor" stroke="none" />
  </svg>
);
export const GMine = ({ active, ...p }: G) => (
  <svg {...g(p)}>
    <path d="M12 3c.6 5.2 2.2 7.8 9 9-6.8 1.2-8.4 3.8-9 9-.6-5.2-2.2-7.8-9-9 6.8-1.2 8.4-3.8 9-9z" fill={active ? "currentColor" : "none"} />
  </svg>
);
export const GTorch = (p: G) => (
  <svg {...g(p)}>
    <path d="M9 3.6h6l-1.2 6H10.2z" />
    <path d="M10.2 9.6v9.6a1.8 1.8 0 0 0 3.6 0V9.6" />
    <path d="M12 13v2.4" />
  </svg>
);
export const GCompass = (p: G) => (
  <svg {...g(p)}>
    <path d="M18.4 5.4A9 9 0 1 0 21 11" />
    <path d="m15 9-1.6 4.6L9 15.2l1.6-4.6z" />
  </svg>
);
export const GMic = (p: G) => (
  <svg {...g(p)}>
    <rect x="9" y="3" width="6" height="11.4" rx="3" />
    <path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8V21" />
  </svg>
);
export const GSend = (p: G) => (
  <svg {...g(p)}>
    <path d="M3.6 12.2c5.8-.4 11.2-.3 16.6 0" />
    <path d="m14.8 6.6 5.4 5.6-5.4 5.4" />
  </svg>
);
export const GClose = (p: G) => (
  <svg {...g(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const GCalendar = (p: G) => (
  <svg {...g(p)}>
    <rect x="4" y="5.4" width="16" height="14.6" rx="1.4" />
    <path d="M8.4 3.6v3.4M15.6 3.6v3.4M4 10h16" />
  </svg>
);
export const GLocate = (p: G) => (
  <svg {...g(p)}>
    <path d="M15.6 5.2A7.4 7.4 0 1 0 19.2 10" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2" />
  </svg>
);
export const GDownload = (p: G) => (
  <svg {...g(p)}>
    <path d="M12.2 3.8c-.4 4.6-.3 8.6 0 12.6" />
    <path d="m7 11.6 5.2 5 5-5M4.6 20h14.8" />
  </svg>
);
export const GCheck = (p: G) => (
  <svg {...g(p)}>
    <path d="M17.6 4.9A9 9 0 1 0 20.6 9.4" />
    <path d="m8 12.3 2.7 2.6L20.4 5" />
  </svg>
);
export const GArrow = (p: G) => (
  <svg {...g(p)}>
    <path d="M12 3 19 20l-7-4-7 4z" />
  </svg>
);

/* ---------- small building blocks ---------- */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`t-label text-star/55 ${className}`}>{children}</p>;
}

/** A label-and-value row on a hairline, the app's basic unit of information. */
export function Row({ k, v, sub, className = "" }: { k: ReactNode; v: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 border-t border-star/12 py-3.5 ${className}`}>
      <span className="t-label text-star/55">{k}</span>
      <span className="text-right">
        <span className="t-display tnum block text-[clamp(20px,5.6vw,26px)] leading-none">{v}</span>
        {sub && <span className="t-label mt-1 block text-star/45">{sub}</span>}
      </span>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[640px] px-5 pb-[calc(112px+env(safe-area-inset-bottom,0px))] pt-[calc(84px+env(safe-area-inset-top,0px))] ${className}`}>{children}</div>;
}

export function Heading({ plain, script }: { plain: string; script?: string }) {
  return (
    <h1 className="t-display text-[clamp(52px,15vw,92px)] leading-[0.84]">
      {plain}
      {script && <span className="t-script relative -mt-[0.18em] block text-[0.52em] normal-case">{script}</span>}
    </h1>
  );
}

export function Btn({ children, onClick, href, variant = "line", disabled, className = "", type = "button" }: { children: ReactNode; onClick?: () => void; href?: string; variant?: "line" | "torch" | "ghost"; disabled?: boolean; className?: string; type?: "button" | "submit" }) {
  const base = "t-label inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 transition-colors duration-300 disabled:opacity-50";
  const v = variant === "torch" ? "bg-torch text-night hover:bg-[#ef6a52]" : variant === "ghost" ? "text-star/75 hover:text-star" : "border border-star/35 text-star hover:bg-star hover:text-night";
  if (href) return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`${base} ${v} ${className}`}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v} ${className}`}>{children}</button>;
}

/** Bottom sheet over the sky. Escape and the backdrop close it. */
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <div className={`fixed inset-0 z-40 transition-[visibility] ${open ? "visible" : "invisible delay-500"}`} aria-hidden={!open}>
      <button aria-label="Close" onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        role="dialog"
        aria-label={label}
        className={`absolute inset-x-0 bottom-0 mx-auto max-h-[78svh] w-full max-w-[640px] overflow-y-auto border-t border-star/15 bg-[#0b1519]/95 px-5 pb-[calc(28px+env(safe-area-inset-bottom,0px))] pt-4 backdrop-blur-md transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-star/25" />
        {children}
      </div>
    </div>
  );
}

export const bytes = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.round(n / 1e6)} MB`);
