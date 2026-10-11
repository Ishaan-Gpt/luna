"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HANLE, tonight, type Loc, type Night } from "@/lib/sky";
import { useCatalog, type Catalog } from "@/lib/catalog";
import { computeSky, type SkyState } from "@/lib/lens";
import { isTier, type Tier } from "@/lib/brain";

export type Tab = "sky" | "tonight" | "ask" | "places" | "mine";
type Weather = { lat: number; lon: number; fetchedAt: number; hours: { t: number; cloud: number }[]; now: { cloud: number; temp: number } };
export type Settings = {
  loc: Loc | null;
  locSource: "gps" | "city" | "manual" | null;
  limit: number | null; // limiting magnitude from Sky Check
  red: boolean;
  tier: Tier | null; // chosen model
  alerts: boolean;
  speak: boolean;
};

const DEFAULTS: Settings = { loc: null, locSource: null, limit: null, red: false, tier: null, alerts: false, speak: true };

const read = <T,>(k: string, fb: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? { ...fb, ...JSON.parse(v) } : fb;
  } catch {
    return fb;
  }
};
const readArr = <T,>(k: string, fb: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

type Ctx = {
  ready: boolean;
  settings: Settings;
  update: (p: Partial<Settings>) => void;
  loc: Loc;
  tab: Tab;
  setTab: (t: Tab) => void;
  now: Date; // live clock
  time: Date; // the moment being shown (live or scrubbed)
  offsetMin: number; // minutes from now (scrub)
  setOffsetMin: (m: number) => void;
  setTime: (d: Date | null) => void; // jump to an absolute date (null = back to live)
  live: boolean;
  catalog: Catalog | null;
  sky: SkyState | null;
  night: Night | null;
  weather: Weather | null;
  weatherState: "idle" | "loading" | "ok" | "offline" | "stale";
  refreshWeather: () => void;
  marks: string[];
  toggleMark: (id: string) => void;
  nicknames: Record<string, string>;
  setNickname: (id: string, name: string) => void;
  selected: string | null;
  select: (id: string | null) => void;
  online: boolean;
};

const C = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(C);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [tab, setTabState] = useState<Tab>("sky");
  const [now, setNow] = useState(() => new Date());
  const [offsetMin, setOffsetMin] = useState(0);
  const [abs, setAbs] = useState<Date | null>(null);
  const [marks, setMarks] = useState<string[]>([]);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [selected, select] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherState, setWeatherState] = useState<Ctx["weatherState"]>("idle");
  const [online, setOnline] = useState(true);
  const catalog = useCatalog();

  useEffect(() => {
    const t = setTimeout(() => {
      const st = read("luna-settings", DEFAULTS);
      setSettings({ ...st, tier: isTier(st.tier) ? st.tier : null });
      setMarks(readArr("luna-app-marks", []));
      setNicknames(readArr("luna-app-nicknames", {}));
      setWeather(readArr<Weather | null>("luna-weather", null));
      const h = location.hash.replace("#", "") as Tab;
      if (["sky", "tonight", "ask", "places", "mine"].includes(h)) setTabState(h);
      setOnline(navigator.onLine);
      setReady(true);
    }, 0);
    const tick = setInterval(() => setNow(new Date()), 20000);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      clearTimeout(t);
      clearInterval(tick);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const update = useCallback((p: Partial<Settings>) => {
    setSettings((s) => {
      const n = { ...s, ...p };
      write("luna-settings", n);
      return n;
    });
  }, []);

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    history.replaceState(null, "", `#${t}`);
  }, []);

  const loc = settings.loc ?? HANLE;
  const time = useMemo(() => (abs ? new Date(abs.getTime() + offsetMin * 60000) : new Date(now.getTime() + offsetMin * 60000)), [abs, now, offsetMin]);
  const live = !abs && offsetMin === 0;
  const setTime = useCallback((d: Date | null) => {
    setAbs(d);
    setOffsetMin(0);
  }, []);

  // Sky positions: recomputed when the shown minute or the place changes.
  const minuteKey = Math.floor(time.getTime() / 60000);
  const sky = useMemo(() => (catalog ? computeSky(catalog, time, loc) : null), [catalog, minuteKey, loc]); // eslint-disable-line react-hooks/exhaustive-deps
  const nightKey = Math.floor(time.getTime() / 3600000);
  const night = useMemo(() => tonight(time, loc), [nightKey, loc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cloud forecast from Open-Meteo, cached for offline use.
  const fetching = useRef(false);
  const refreshWeather = useCallback(() => {
    if (fetching.current) return;
    if (!navigator.onLine) {
      setWeatherState(weather ? "stale" : "offline");
      return;
    }
    fetching.current = true;
    setWeatherState("loading");
    const lat = loc.lat.toFixed(2);
    const lon = loc.lon.toFixed(2);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover&current=cloud_cover,temperature_2m&forecast_days=3&timezone=UTC`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        const w: Weather = {
          lat: loc.lat,
          lon: loc.lon,
          fetchedAt: Date.now(),
          hours: (j.hourly.time as string[]).map((t, i) => ({ t: Date.parse(t + "Z"), cloud: j.hourly.cloud_cover[i] as number })),
          now: { cloud: j.current.cloud_cover, temp: j.current.temperature_2m },
        };
        setWeather(w);
        write("luna-weather", w);
        setWeatherState("ok");
      })
      .catch(() => setWeatherState(weather ? "stale" : "offline"))
      .finally(() => (fetching.current = false));
  }, [loc, weather]);

  useEffect(() => {
    if (!ready) return;
    const fresh = weather && Math.abs(weather.lat - loc.lat) < 0.05 && Math.abs(weather.lon - loc.lon) < 0.05 && Date.now() - weather.fetchedAt < 3 * 3600000;
    if (fresh) {
      setTimeout(() => setWeatherState("ok"), 0);
      return;
    }
    const t = setTimeout(refreshWeather, 0);
    return () => clearTimeout(t);
  }, [ready, loc.lat, loc.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMark = useCallback((id: string) => {
    setMarks((m) => {
      const n = m.includes(id) ? m.filter((x) => x !== id) : [...m, id];
      write("luna-app-marks", n);
      return n;
    });
  }, []);
  const setNickname = useCallback((id: string, name: string) => {
    setNicknames((n) => {
      const next = { ...n, [id]: name.slice(0, 28) };
      if (!name.trim()) delete next[id];
      write("luna-app-nicknames", next);
      return next;
    });
  }, []);

  const value: Ctx = {
    ready, settings, update, loc, tab, setTab, now, time, offsetMin, setOffsetMin, setTime, live, catalog, sky, night,
    weather, weatherState, refreshWeather, marks, toggleMark, nicknames, setNickname, selected, select, online,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
