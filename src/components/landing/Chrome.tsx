import { Emblem } from "./primitives";

const tone = "transition-colors duration-700 text-star data-[tone=light]:text-ink data-[tone=moon]:text-ink";

export function Chrome() {
  return (
    <div className="chrome pointer-events-none fixed inset-0 z-50">
      {/* Emblem */}
      <a
        href="#top"
        data-tone-target
        aria-label="Luna, back to top"
        className={`pointer-events-auto absolute left-[var(--gutter)] top-[clamp(14px,2.2vw,32px)] ${tone}`}
      >
        <span className="hidden lg:inline-block"><Emblem size={92} /></span>
        <span className="lg:hidden"><Emblem size={64} /></span>
      </a>

      {/* Nav */}
      <nav data-tone-target aria-label="Primary" className={`pointer-events-auto absolute right-[var(--gutter)] top-[clamp(18px,2.4vw,36px)] flex flex-col items-end gap-3 text-right ${tone}`}>
        <a href="/sky" className="t-display group text-[clamp(20px,1.55vw,30px)] leading-[0.92]">
          <span className="block">Open</span>
          <span className="block border-b border-current pb-[0.1em]">Luna tonight</span>
        </a>
        <div className="hidden flex-col items-end gap-1.5 sm:flex">
          <a href="#waitlist" className="t-label ulink">Join the waitlist</a>
          <a href="#reasons" className="t-label ulink">How it works</a>
        </div>
      </nav>

      {/* Progress rail */}
      <div
        data-rail
        data-tone-target
        className={`absolute bottom-[8vh] top-[26vh] hidden w-[92px] flex-col items-center lg:flex ${tone}`}
        style={{ left: "var(--gutter)" }}
        aria-hidden
      >
        <span data-rail-label className="t-label tnum mb-3 !tracking-[0.12em]">00</span>
        <span className="relative w-px flex-1 bg-current/25">
          <span className="absolute inset-x-0 top-0 bg-current" style={{ height: "var(--progress, 0%)" }} />
        </span>
        <span className="t-label mt-4 [writing-mode:vertical-rl] rotate-180">Scroll</span>
      </div>
    </div>
  );
}
