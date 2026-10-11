"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";
import { HANLE, tonight, type Loc, type Night } from "./sky";

type Weather = { hours: { t: Date; cloud: number }[]; now: { cloud: number; temp: number } } | null;
type GeoState = "idle" | "asking" | "denied" | "ok";

type Ctx = {
  loc: Loc;
  now: Date | null; // null until mounted (time-dependent values never render on the server)
  night: Night | null;
  weather: Weather;
  weatherState: "loading" | "ok" | "offline";
  geo: GeoState;
  locateMe: () => void;
  resetLocation: () => void;
  marks: string[];
  toggleMark: (id: string) => void;
  nicknames: Record<string, string>;
  setNickname: (id: string, name: string) => void;
  progress: MotionValue<number>;
  timeAt: (p: number) => Date | null;
};

const SkyCtx = createContext<Ctx | null>(null);

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function SkyProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState<Loc>(HANLE);
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<Weather>(null);
  const [weatherState, setWeatherState] = useState<Ctx["weatherState"]>("loading");
  const [geo, setGeo] = useState<GeoState>("idle");
  const [marks, setMarks] = useState<string[]>(["vega"]);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const { scrollYProgress } = useScroll();

  // Live clock, after mount.
  useEffect(() => {
    const t = setTimeout(() => {
      setNow(new Date());
      setMarks(read("luna-marks", ["vega"]));
      setNicknames(read("luna-nicknames", {}));
    }, 0);
    const i = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, []);

  const hourKey = now ? now.getHours() : null;
  const night = useMemo(() => (now ? tonight(now, loc) : null), [loc, hourKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cloud cover, when there is a signal. The sky maths above never needs one.
  useEffect(() => {
    const ctrl = new AbortController();
    const lat = loc.lat.toFixed(1);
    const lon = loc.lon.toFixed(1);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover&current=cloud_cover,temperature_2m&forecast_days=2&timezone=UTC`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const hours = (j.hourly.time as string[]).map((t, i) => ({ t: new Date(t + "Z"), cloud: j.hourly.cloud_cover[i] as number }));
        setWeather({ hours, now: { cloud: j.current.cloud_cover, temp: j.current.temperature_2m } });
        setWeatherState("ok");
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setWeatherState("offline");
      });
    return () => ctrl.abort();
  }, [loc]);

  const locateMe = useCallback(() => {
    if (!("geolocation" in navigator)) return setGeo("denied");
    setGeo("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setWeatherState("loading");
        setLoc({
          name: "Your location",
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          elev: p.coords.altitude ?? 0,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          own: true,
        });
        setGeo("ok");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }, []);

  const resetLocation = useCallback(() => {
    setWeatherState("loading");
    setLoc(HANLE);
    setGeo("idle");
  }, []);

  const toggleMark = useCallback((id: string) => {
    setMarks((m) => {
      const next = m.includes(id) ? m.filter((x) => x !== id) : [...m, id];
      write("luna-marks", next);
      return next;
    });
  }, []);

  const setNickname = useCallback((id: string, name: string) => {
    setNicknames((n) => {
      const next = { ...n, [id]: name.slice(0, 28) };
      if (!name.trim()) delete next[id];
      write("luna-nicknames", next);
      return next;
    });
  }, []);

  const timeAt = useCallback(
    (p: number) => {
      if (!night) return null;
      const start = night.sunset.getTime() - 25 * 60000;
      const end = night.sunrise.getTime() + 20 * 60000;
      return new Date(start + Math.min(1, Math.max(0, p)) * (end - start));
    },
    [night],
  );

  const value: Ctx = {
    loc, now, night, weather, weatherState, geo, locateMe, resetLocation,
    marks, toggleMark, nicknames, setNickname, progress: scrollYProgress, timeAt,
  };
  return <SkyCtx.Provider value={value}>{children}</SkyCtx.Provider>;
}

export function useSky() {
  const c = useContext(SkyCtx);
  if (!c) throw new Error("useSky outside SkyProvider");
  return c;
}
