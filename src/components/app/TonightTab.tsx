"use client";

import { useMemo } from "react";
import { fmtDate, fmtTime, moonAltAz, moonInfo, sunAltAz, twilightName, upcomingEvents } from "@/lib/sky";
import { NightBar } from "../NightBar";
import { useApp } from "./store";
import { Btn, Heading, Label, Panel, Row } from "./ui";

export function TonightTab() {
  const { loc, night, now, weather, weatherState, refreshWeather, setTime, setTab } = useApp();
  const sun = sunAltAz(now, loc);
  const moonNow = moonAltAz(now, loc);
  const mid = night ? new Date((night.sunset.getTime() + night.sunrise.getTime()) / 2) : now;
  const moon = moonInfo(mid);
  const dayKey = now.toDateString();
  const events = useMemo(() => upcomingEvents(now, loc, 8), [dayKey, loc]); // eslint-disable-line react-hooks/exhaustive-deps

  const clouds = useMemo(() => {
    if (!weather || !night) return null;
    const hrs = weather.hours.filter((h) => h.t >= night.sunset.getTime() && h.t <= night.sunrise.getTime());
    if (!hrs.length) return null;
    return { avg: Math.round(hrs.reduce((a, h) => a + h.cloud, 0) / hrs.length), hours: hrs.map((h) => ({ t: new Date(h.t), cloud: h.cloud })) };
  }, [weather, night]);
  const verdict = clouds ? (clouds.avg < 20 ? "Clear. Go out." : clouds.avg < 50 ? "Patchy. Gaps worth waiting for." : clouds.avg < 80 ? "Mostly cloudy." : "Overcast tonight.") : null;

  const goBest = () => {
    const t = night?.best?.start ?? night?.darkStart;
    if (t) setTime(t);
    setTab("sky");
  };

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <Panel>
        <Heading plain="Tonight" script={`over ${loc.name}`} />
        <p className="t-label mt-4 text-star/50">{night ? fmtDate(night.sunset, loc.tz, { weekday: "long", day: "numeric", month: "long" }) : ""}</p>

        <div className="mt-10">
          <Label>Truly dark</Label>
          <p className="t-display tnum mt-2 text-[clamp(64px,19vw,120px)] leading-[0.82]">
            {night?.darkStart && night.darkEnd ? `${fmtTime(night.darkStart, loc.tz)}—${fmtTime(night.darkEnd, loc.tz)}` : "Not tonight"}
          </p>
          {night?.best ? (
            <p className="t-body mt-4 text-star/75">
              Best moon-free stretch: <span className="text-torch">{fmtTime(night.best.start, loc.tz)} to {fmtTime(night.best.end, loc.tz)}</span>
            </p>
          ) : (
            <p className="t-body mt-4 text-star/75">The Moon is up through the dark hours, so faint stars will be washed out.</p>
          )}
          <div className="mt-5"><Btn onClick={goBest}>See that sky</Btn></div>
        </div>

        <div className="mt-12">
          <NightBar night={night} loc={loc} cursor={now} clouds={clouds?.hours ?? null} />
        </div>

        <div className="mt-10">
          <Row k="Sun now" v={`${sun.alt >= 0 ? "+" : "−"}${Math.abs(sun.alt).toFixed(1)}°`} sub={twilightName(sun.alt)} />
          <Row k="Sunset · sunrise" v={`${fmtTime(night?.sunset, loc.tz)} · ${fmtTime(night?.sunrise, loc.tz)}`} />
          <Row k="Moon" v={`${Math.round(moon.fraction * 100)}% lit`} sub={`${moon.name} · now ${moonNow.alt >= 0 ? `${Math.round(moonNow.alt)}° up` : "below the horizon"}`} />
          <Row k="Moonrise · set" v={`${fmtTime(night?.moonrise, loc.tz)} · ${fmtTime(night?.moonset, loc.tz)}`} />
          <Row
            k="Cloud tonight"
            v={clouds ? `${clouds.avg}%` : weatherState === "loading" ? "…" : "No forecast"}
            sub={
              clouds
                ? `${verdict} Forecast ${weatherState === "stale" ? "saved" : "fetched"} ${weather ? fmtTime(new Date(weather.fetchedAt), loc.tz) : ""}`
                : weatherState === "offline"
                  ? "Needs a signal once, then Luna keeps a copy"
                  : undefined
            }
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="t-label text-star/40">Forecast by Open-Meteo</span>
            <Btn variant="ghost" onClick={refreshWeather}>Refresh</Btn>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="t-display text-[clamp(36px,10vw,52px)] leading-[0.9]">Coming up</h2>
          <ul className="mt-4">
            {events.map((e) => (
              <li key={e.title + e.date.toISOString()} className="flex gap-4 border-t border-star/12 py-4">
                <span className="w-14 shrink-0">
                  <span className="t-display tnum block text-[34px] leading-none">{fmtDate(e.date, loc.tz, { day: "numeric" })}</span>
                  <span className="t-label block text-star/50">{fmtDate(e.date, loc.tz, { month: "short" })}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px]">{e.title}</span>
                  <span className="t-body block text-star/60">{e.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </div>
  );
}
