"use client";

import { useMemo, useState } from "react";
import { bearing, compass, distanceKm } from "@/lib/sky";
import { PLACES } from "@/lib/stars";
import { useWatchPosition } from "@/lib/sensors";
import { usePointer } from "./Shell";
import { useApp } from "./store";
import { Btn, GArrow, GPlaces, Heading, Panel, Row } from "./ui";

const km = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : d < 100 ? `${d.toFixed(1)} km` : `${Math.round(d).toLocaleString("en-IN")} km`);

export function PlacesTab() {
  const { loc, online } = useApp();
  const pointer = usePointer();
  const [pick, setPick] = useState<string | null>(null);
  const [nav, setNav] = useState(false);
  const gps = useWatchPosition(nav);
  const here = nav && gps.pos ? gps.pos : loc;

  const list = useMemo(() => PLACES.map((p) => ({ ...p, d: distanceKm(here, p), b: bearing(here, p) })).sort((a, b) => a.d - b.d), [here]);
  const place = list.find((p) => p.id === pick) ?? null;
  // arrow relative to where the phone's top faces (when held flat)
  const rel = place && pointer.heading != null ? (place.b - pointer.heading + 360) % 360 : null;

  const startNav = async () => {
    if (pointer.state === "needs-permission") await pointer.request();
    setNav(true);
  };

  if (place) {
    return (
      <div className="absolute inset-0 overflow-y-auto">
        <Panel>
          <button onClick={() => { setPick(null); setNav(false); }} className="t-label text-star/55 hover:text-star">← All places</button>
          <p className="t-label mt-6 text-star/55">{place.region}</p>
          <h1 className="t-display mt-1 text-[clamp(44px,12vw,72px)] leading-[0.86]">{place.name}</h1>
          <p className="t-body mt-3 text-star/70">{place.note}</p>

          <div className="mt-8 flex flex-col items-center">
            <div className="relative h-56 w-56">
              <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
                <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeOpacity=".25" />
                {Array.from({ length: 72 }, (_, i) => {
                  const a = (i * 5 * Math.PI) / 180;
                  const r2 = i % 18 === 0 ? 80 : i % 6 === 0 ? 85 : 89;
                  return <line key={i} x1={(100 + Math.sin(a) * 92).toFixed(1)} y1={(100 - Math.cos(a) * 92).toFixed(1)} x2={(100 + Math.sin(a) * r2).toFixed(1)} y2={(100 - Math.cos(a) * r2).toFixed(1)} stroke="currentColor" strokeOpacity=".45" />;
                })}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-torch transition-transform duration-300" style={{ transform: `rotate(${nav && rel != null ? rel : place.b}deg)` }}>
                <GArrow size={86} />
              </div>
            </div>
            <p className="t-label mt-4 text-center text-star/60">
              {nav ? (rel != null ? "Walk the way the arrow points" : pointer.state === "unsupported" ? "This device has no compass. The arrow shows the bearing from north." : "Hold the phone flat to steer") : `Bearing ${Math.round(place.b)}° from north`}
            </p>
          </div>

          <div className="mt-8">
            <Row k="Distance" v={km(place.d)} sub={nav && gps.pos ? `live GPS · ±${Math.round(gps.pos.acc)} m` : `from ${loc.name}, straight line`} />
            <Row k="Direction" v={`${Math.round(place.b)}° ${compass(place.b)}`} />
          </div>
          {gps.error && nav && <p className="t-label mt-3 text-torch">{gps.error}</p>}

          <div className="mt-8 flex flex-wrap gap-2">
            {!nav ? <Btn variant="torch" onClick={startNav}>Navigate with Luna</Btn> : <Btn onClick={() => setNav(false)}>Stop</Btn>}
            <Btn href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`}>Open in Maps{online ? "" : " (needs a signal)"}</Btn>
          </div>
          <p className="t-label mt-4 text-star/40">GPS and the compass work with no signal, so the arrow and distance keep going after the bars disappear.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <Panel>
        <Heading plain="Darker" script="places near you" />
        <p className="t-body mt-5 text-star/70">Places where the night is properly dark, nearest first, measured from {loc.name}.</p>
        <ul className="mt-8">
          {list.map((p) => (
            <li key={p.id}>
              <button onClick={() => setPick(p.id)} className="flex w-full items-center gap-4 border-t border-star/12 py-4 text-left">
                <GPlaces size={20} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px]">{p.name}</span>
                  <span className="t-label block text-star/45">{p.region}</span>
                </span>
                <span className="t-label tnum text-right text-star/70">
                  {km(p.d)}
                  <span className="block text-star/40">{compass(p.b)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
