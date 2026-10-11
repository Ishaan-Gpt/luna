"use client";

import { useEffect, useState } from "react";
import { altFn, riseSet } from "@/lib/ground";
import { fmtTime } from "@/lib/sky";
import { AppProvider, useApp } from "./store";
import { Shell } from "./Shell";
import { Onboarding } from "./Onboarding";
import { SkyTab } from "./SkyTab";
import { TonightTab } from "./TonightTab";
import { AskTab } from "./AskTab";
import { PlacesTab } from "./PlacesTab";
import { MineTab } from "./MineTab";

export function SkyApp() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

function Root() {
  const { ready, settings, tab } = useApp();
  const [onboarded, setOnboarded] = useState(false);
  useRiseAlerts();
  useServiceWorker();

  if (!ready) return <div className="fixed inset-0 grid place-items-center bg-night"><p className="t-label text-star/50">Opening the sky…</p></div>;
  const needsSetup = !onboarded && (!settings.loc || settings.limit === null);
  if (needsSetup) return <Onboarding onDone={() => setOnboarded(true)} />;

  return (
    <Shell>
      {tab === "sky" && <SkyTab />}
      {tab === "tonight" && <TonightTab />}
      {tab === "ask" && <AskTab />}
      {tab === "places" && <PlacesTab />}
      {tab === "mine" && <MineTab />}
    </Shell>
  );
}

/** While Luna is open, notify when a marked object rises (next 12 hours). */
function useRiseAlerts() {
  const { settings, marks, sky, loc, now, nicknames } = useApp();
  const hourKey = Math.floor(now.getTime() / 3600000);
  useEffect(() => {
    if (!settings.alerts || !sky || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const start = new Date();
    for (const id of marks) {
      const o = sky.objs.find((x) => x.id === id);
      const fn = o && altFn(o, loc);
      if (!o || !fn) continue;
      const rs = riseSet(fn, start);
      if (!rs.rise) continue;
      const wait = rs.rise.getTime() - Date.now();
      if (wait <= 0 || wait > 12 * 3600000) continue;
      const name = nicknames[id] ? `“${nicknames[id]}” (${o.name})` : o.name;
      timers.push(
        setTimeout(async () => {
          const body = `${name} is rising now. It's highest at ${fmtTime(rs.top.at, loc.tz)}.`;
          try {
            const reg = await navigator.serviceWorker?.getRegistration();
            if (reg) await reg.showNotification("Luna", { body, icon: "/icons/icon-192.png", tag: id });
            else new Notification("Luna", { body });
          } catch {
            new Notification("Luna", { body });
          }
        }, wait),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [settings.alerts, marks, sky?.loc, loc, hourKey, nicknames]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Offline support: register the service worker in production builds. */
function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
}
