import type { SVGProps } from "react";

/**
 * The Nebua mark: a planisphere. A disc with brass hour ticks and an offset oval window
 * (the opening that shows tonight's sky), with one four-point star inside it.
 */
export function LogoMark({ size = 28, ...p }: SVGProps<SVGSVGElement> & { size?: number }) {
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r1 = 14.2;
    const r2 = i % 6 === 0 ? 12.4 : 13.3;
    return `M${(16 + Math.sin(a) * r1).toFixed(2)} ${(16 - Math.cos(a) * r1).toFixed(2)}L${(16 + Math.sin(a) * r2).toFixed(2)} ${(16 - Math.cos(a) * r2).toFixed(2)}`;
  }).join("");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden {...p}>
      <circle cx="16" cy="16" r="15" stroke="var(--brass)" strokeWidth="1" />
      <path d={ticks} stroke="var(--brass)" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="16" cy="14.2" rx="8.2" ry="6.6" stroke="var(--star)" strokeWidth="1.3" />
      <path d="M16 9.6c.3 2.6 1.1 3.9 4.6 4.6-3.5.7-4.3 2-4.6 4.6-.3-2.6-1.1-3.9-4.6-4.6 3.5-.7 4.3-2 4.6-4.6z" fill="var(--torch)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-display italic tracking-[-0.02em] ${className}`}>Nebua</span>;
}
