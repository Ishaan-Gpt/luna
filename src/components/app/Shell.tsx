"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePointing, type Pointing, type SensorState } from "@/lib/sensors";
import { fmtTime } from "@/lib/sky";
import { detectPlatform } from "@/lib/platform";
import { Mark } from "../landing/primitives";
import { useApp, type Tab } from "./store";
import { GAsk, GMine, GPlaces, GSky, GTonight, GTorch } from "./ui";

/* Pointing is shared by Sky, Ask and Places. */
type PointerCtx = { state: SensorState; pointing: Pointing | null; heading: number | null; request: () => Promise<void> };
const PC = createContext<PointerCtx | null>(null);
export const usePointer = () => useContext(PC)!;

const TABS: { id: Tab; label: string; G: typeof GSky }[] = [
  { id: "sky", label: "Sky", G: GSky },
  { id: "tonight", label: "Tonight", G: GTonight },
  { id: "ask", label: "Ask", G: GAsk },
  { id: "places", label: "Places", G: GPlaces },
  { id: "mine", label: "Mine", G: GMine },
];

export function Shell({ children }: { children: ReactNode }) {
  const { tab, setTab, loc, time, live, settings, update, online } = useApp();
  const sensor = usePointing(true);
  const [installEvt, setInstallEvt] = useState<Event | null>(null);
  const [desktop] = useState(() => detectPlatform().os === "desktop");

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  useEffect(() => {
    (window as Window & { __lunaInstall?: Event | null }).__lunaInstall = installEvt;
  }, [installEvt]);

  return (
    <PC.Provider value={sensor}>
      <div className="fixed inset-0 overflow-hidden bg-night text-star" style={settings.red ? { filter: "grayscale(1) sepia(1) saturate(6) hue-rotate(-40deg) brightness(.72)" } : undefined}>
        {children}

        {/* top bar */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 bg-gradient-to-b from-night/85 via-night/40 to-transparent px-4 pb-6 pt-[calc(12px+env(safe-area-inset-top,0px))]">
          <Link href="/" aria-label="Luna home" className="pointer-events-auto flex items-center gap-2">
            <Mark size={30} />
            <span className="t-display text-[22px] leading-none">Luna</span>
          </Link>
          {desktop && (
            <a href="/get" className="pointer-events-auto t-label hidden items-center gap-2 rounded-full border border-star/20 px-4 py-2 text-star/70 hover:border-star/50 hover:text-star md:inline-flex">
              Computer preview · <span className="text-torch">get Luna on your phone</span>
            </a>
          )}
          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => setTab("mine")} className="text-right leading-tight" aria-label="Place and time, change in Mine">
              <span className="t-label block text-star/85">{loc.name}</span>
              <span className="t-label tnum block text-star/50">
                {live ? "Live" : "Shown"} · {fmtTime(time, loc.tz)}
                {!online && " · offline"}
              </span>
            </button>
            <button
              onClick={() => update({ red: !settings.red })}
              aria-pressed={settings.red}
              aria-label={settings.red ? "Turn off red night mode" : "Turn on red night mode"}
              className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${settings.red ? "border-torch bg-torch/20 text-torch" : "border-star/25 text-star/80"}`}
            >
              <GTorch size={18} />
            </button>
          </div>
        </header>

        {/* dock */}
        <nav aria-label="Luna" className="absolute inset-x-0 bottom-0 z-30 border-t border-star/10 bg-night/88 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md">
          <ul className="mx-auto grid max-w-[560px] grid-cols-5">
            {TABS.map(({ id, label, G }) => {
              const on = tab === id;
              return (
                <li key={id}>
                  <button onClick={() => setTab(id)} aria-current={on ? "page" : undefined} className={`flex w-full flex-col items-center gap-1 py-2.5 transition-colors ${on ? "text-star" : "text-star/45 hover:text-star/75"}`}>
                    <G size={22} active={on} />
                    <span className="t-label !text-[9px] !tracking-[0.2em]">{label}</span>
                    <span className={`h-1 w-1 rounded-full transition-colors ${on ? "bg-torch" : "bg-transparent"}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </PC.Provider>
  );
}
