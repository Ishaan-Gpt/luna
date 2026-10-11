"use client";

import { useEffect, useMemo, useState } from "react";
import { CITIES } from "@/lib/cities";
import { altFn, dirWord, fistsText, riseSet } from "@/lib/ground";
import { computeSky, drawLens } from "@/lib/lens";
import { fmtDate, fmtTime } from "@/lib/sky";
import { storageEstimate } from "@/lib/brain";
import { fam } from "@/lib/draw";
import { useApp } from "./store";
import { SkyCheck, bortleFor } from "./SkyCheck";
import { Btn, GDownload, GLocate, GMine, Heading, Label, Panel, bytes } from "./ui";

export function MineTab() {
  const app = useApp();
  const { sky, marks, nicknames, loc, settings, update, catalog, now, night, select, setTab, toggleMark } = app;
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [card, setCard] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    storageEstimate().then(setUsage);
    setTimeout(() => setPerm("Notification" in window ? Notification.permission : "unsupported"), 0);
  }, []);

  const mine = useMemo(() => {
    if (!sky) return [];
    return marks
      .map((id) => sky.objs.find((o) => o.id === id))
      .filter((o): o is NonNullable<typeof o> => !!o)
      .map((o) => {
        const fn = altFn(o, loc);
        return { o, rs: fn ? riseSet(fn, sky.date) : null };
      });
  }, [marks, sky, loc]);

  const enableAlerts = async () => {
    if (!("Notification" in window)) return setPerm("unsupported");
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") update({ alerts: true });
  };

  const gps = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        update({ loc: { name: "Your location", lat: p.coords.latitude, lon: p.coords.longitude, elev: p.coords.altitude ?? 0, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }, locSource: "gps" });
        setPlacing(false);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  /* Paper exit: tonight's sky drawn into a phone-sized lock screen image */
  const makeCard = async () => {
    if (!catalog) return;
    setMaking(true);
    await new Promise((r) => setTimeout(r, 30));
    const W = 1080, H = 2340;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const when = night?.best?.start ?? night?.darkStart ?? new Date(now.getTime() + 3 * 3600000);
    const s = computeSky(catalog, when, loc);
    // the sky over the equator-side horizon, filling the top two thirds
    const skyH = Math.round(H * 0.68);
    const off = document.createElement("canvas");
    off.width = W;
    off.height = skyH;
    drawLens(off.getContext("2d")!, W, skyH, s, { az: loc.lat >= 0 ? 180 : 0, alt: 42, vfov: 96 }, { limit: settings.limit ?? 4.5, marks: new Set(marks), nicknames, font: `30px ${fam("--font-hanken")}` });
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#081115");
    g.addColorStop(1, "#050909");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(off, 0, 0);
    const fade = ctx.createLinearGradient(0, skyH * 0.55, 0, skyH);
    fade.addColorStop(0, "rgba(5,9,9,0)");
    fade.addColorStop(1, "rgba(5,9,9,1)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, skyH * 0.55, W, skyH * 0.45 + 2);
    const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "serif";
    const sans = fam("--font-hanken");
    ctx.fillStyle = "#f3f1ea";
    ctx.textAlign = "left";
    ctx.font = `600 34px ${sans}`;
    ctx.fillStyle = "rgba(243,241,234,.6)";
    ctx.fillText(`TONIGHT · ${loc.name.toUpperCase()}`, 90, skyH + 20);
    ctx.fillStyle = "#f3f1ea";
    ctx.font = `120px ${serif}`;
    const win = night?.darkStart && night.darkEnd ? `${fmtTime(night.darkStart, loc.tz)}—${fmtTime(night.darkEnd, loc.tz)}` : fmtTime(when, loc.tz);
    ctx.fillText(win, 90, skyH + 150);
    ctx.font = `600 30px ${sans}`;
    ctx.fillStyle = "rgba(243,241,234,.55)";
    ctx.fillText(`TRULY DARK · ${fmtDate(when, loc.tz, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}`, 90, skyH + 205);
    const picks = s.objs.filter((o) => o.alt > 12 && o.kind !== "sun" && (o.kind !== "star" || !o.name.startsWith("HIP"))).sort((a, b) => a.mag - b.mag).slice(0, 3);
    picks.forEach((o, i) => {
      const y = skyH + 300 + i * 120;
      ctx.fillStyle = "#f3f1ea";
      ctx.font = `76px ${serif}`;
      ctx.fillText(nicknames[o.id] ? `“${nicknames[o.id]}”` : o.name, 90, y);
      ctx.font = `600 30px ${sans}`;
      ctx.fillStyle = "rgba(243,241,234,.6)";
      ctx.fillText(`${fistsText(o.alt).toUpperCase()} · ${dirWord(o.az).toUpperCase()} · AT ${fmtTime(when, loc.tz)}`, 90, y + 46);
    });
    ctx.font = `600 26px ${sans}`;
    ctx.fillStyle = "rgba(229,83,61,.85)";
    ctx.fillText("LUNA · ONE FIST AT ARM'S LENGTH ≈ 10°", 90, H - 64);
    setCard(c.toDataURL("image/png"));
    setMaking(false);
  };

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <Panel>
        <Heading plain="Mine" script="stars, names, paper" />

        {/* marked */}
        <section className="mt-10">
          <h2 className="t-display text-[clamp(32px,9vw,46px)] leading-[0.9]">Your stars</h2>
          {mine.length === 0 ? (
            <p className="t-body mt-3 text-star/60">Tap anything in the sky and press Mark it. Luna keeps track of when it rises, peaks and sets.</p>
          ) : (
            <ul className="mt-4">
              {mine.map(({ o, rs }) => (
                <li key={o.id} className="flex items-center gap-3 border-t border-star/12 py-4">
                  <button onClick={() => { select(o.id); setTab("sky"); }} className="min-w-0 flex-1 text-left">
                    <span className="t-display block text-[26px] leading-none">{nicknames[o.id] ? `“${nicknames[o.id]}”` : o.name}</span>
                    <span className="t-label mt-1 block text-star/50">
                      {o.alt > 0 ? `${Math.round(o.alt)}° up · ${dirWord(o.az)}` : "below the horizon"}
                      {rs?.rise ? ` · rises ${fmtTime(rs.rise, loc.tz)}` : ""}
                      {rs && rs.top.alt > 0 ? ` · highest ${fmtTime(rs.top.at, loc.tz)}` : ""}
                      {rs?.set ? ` · sets ${fmtTime(rs.set, loc.tz)}` : ""}
                    </span>
                  </button>
                  <button onClick={() => toggleMark(o.id)} aria-label={`Unmark ${o.name}`} className="text-torch"><GMine size={20} active /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 rounded-2xl border border-star/12 p-4">
            <p className="text-[16px]">Rise alerts</p>
            <p className="t-body mt-1 text-star/60">A notification when one of your stars clears the horizon. Alerts fire while Luna is open, in a tab or installed as an app.</p>
            <div className="mt-3">
              {perm === "unsupported" ? (
                <p className="t-label text-star/45">This browser doesn&rsquo;t support notifications.</p>
              ) : settings.alerts && perm === "granted" ? (
                <Btn onClick={() => update({ alerts: false })}>Turn alerts off</Btn>
              ) : perm === "denied" ? (
                <p className="t-label text-torch">Notifications are blocked for this site in your browser settings.</p>
              ) : (
                <Btn variant="torch" onClick={enableAlerts}>Turn on alerts</Btn>
              )}
            </div>
          </div>
        </section>

        {/* paper exit */}
        <section className="mt-12">
          <h2 className="t-display text-[clamp(32px,9vw,46px)] leading-[0.9]">Leave the phone</h2>
          <p className="t-body mt-3 text-star/60">Tonight as your lock screen, so you can check the sky without unlocking. Or a paper planisphere for your latitude.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="torch" onClick={makeCard} disabled={making || !catalog}>{making ? "Drawing…" : "Make tonight's lock screen"}</Btn>
            <Btn href={`/sky/print?lat=${loc.lat.toFixed(2)}&name=${encodeURIComponent(loc.name)}`}>Print a planisphere</Btn>
          </div>
          {card && (
            <div className="mt-5 flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card} alt="Tonight's lock screen" className="w-[60%] max-w-[260px] rounded-[22px] border border-star/15" />
              <a href={card} download={`luna-tonight-${fmtDate(now, loc.tz, { day: "2-digit", month: "2-digit" }).replace("/", "-")}.png`} className="t-label inline-flex min-h-11 items-center gap-2 rounded-full border border-star/35 px-5 hover:bg-star hover:text-night">
                <GDownload size={16} /> Save image
              </a>
            </div>
          )}
        </section>

        {/* sky check */}
        <section className="mt-12">
          <h2 className="t-display text-[clamp(32px,9vw,46px)] leading-[0.9]">Your sky</h2>
          <p className="t-body mt-3 text-star/60">
            {settings.limit != null ? `Stars to about magnitude ${settings.limit} (Bortle ${bortleFor(settings.limit)}).` : "Not checked yet."} Luna hides anything fainter.
          </p>
          {checking && catalog ? (
            <div className="mt-4">
              <SkyCheck cat={catalog} date={now} loc={loc} value={settings.limit} onPick={(m) => { update({ limit: m }); setChecking(false); }} />
            </div>
          ) : (
            <div className="mt-4"><Btn onClick={() => setChecking(true)}>Do the sky check again</Btn></div>
          )}
        </section>

        {/* place */}
        <section className="mt-12">
          <h2 className="t-display text-[clamp(32px,9vw,46px)] leading-[0.9]">Your place</h2>
          <p className="t-body mt-3 text-star/60">{loc.name} · {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}° · {loc.tz}</p>
          {placing ? (
            <div className="mt-4">
              <Btn variant="torch" onClick={gps}><GLocate size={16} /> Use my location</Btn>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CITIES.map((c) => (
                  <button key={c.name} onClick={() => { update({ loc: c, locSource: "city" }); setPlacing(false); }} className="rounded-xl border border-star/12 px-3 py-3 text-left text-[14px] hover:border-star/40">{c.name}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4"><Btn onClick={() => setPlacing(true)}>Change place</Btn></div>
          )}
        </section>

        {/* settings */}
        <section className="mt-12">
          <Label>Settings</Label>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center justify-between border-t border-star/12 py-3">
              <span className="text-[16px]">Speak answers aloud</span>
              <input type="checkbox" checked={settings.speak} onChange={(e) => update({ speak: e.target.checked })} className="h-5 w-5 accent-[#e5533d]" />
            </label>
            <label className="flex items-center justify-between border-t border-star/12 py-3">
              <span className="text-[16px]">Red night mode</span>
              <input type="checkbox" checked={settings.red} onChange={(e) => update({ red: e.target.checked })} className="h-5 w-5 accent-[#e5533d]" />
            </label>
            <div className="flex items-center justify-between border-t border-star/12 py-3">
              <span className="text-[16px]">Stored on this device</span>
              <span className="t-label text-star/55">{usage ? bytes(usage.usage) : "—"}</span>
            </div>
            <InstallRow />
          </div>
        </section>
      </Panel>
    </div>
  );
}

function InstallRow() {
  const [evt, setEvt] = useState<(Event & { prompt?: () => Promise<void> }) | null>(null);
  useEffect(() => {
    const t = setInterval(() => setEvt((window as Window & { __lunaInstall?: Event | null }).__lunaInstall ?? null), 1000);
    return () => clearInterval(t);
  }, []);
  const standalone = typeof window !== "undefined" && matchMedia("(display-mode: standalone)").matches;
  return (
    <div className="flex items-center justify-between border-t border-star/12 py-3">
      <span className="text-[16px]">Install Luna</span>
      {standalone ? <span className="t-label text-star/55">Installed</span> : evt?.prompt ? <Btn onClick={() => evt.prompt?.()}>Install</Btn> : <span className="t-label max-w-[50%] text-right text-star/45">Use your browser menu: Add to Home Screen</span>}
    </div>
  );
}
