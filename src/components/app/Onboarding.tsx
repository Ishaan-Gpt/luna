"use client";

import { useEffect, useState } from "react";
import { CITIES } from "@/lib/cities";
import { TIERS, gpuInfo, suggestTier, type GpuInfo, type Tier } from "@/lib/brain";
import type { Loc } from "@/lib/sky";
import { Mark } from "../landing/primitives";
import { useApp } from "./store";
import { SkyCheck, bortleFor } from "./SkyCheck";
import { Btn, GLocate, bytes } from "./ui";

/** Three steps, all skippable after the first: where you are, what your sky shows, which brain to use. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { update, settings, catalog, now } = useApp();
  const [step, setStep] = useState(0);
  const [geo, setGeo] = useState<"idle" | "asking" | "denied">("idle");
  const [manual, setManual] = useState({ lat: "", lon: "" });
  const [gpu, setGpu] = useState<GpuInfo | null>(null);

  useEffect(() => {
    if (step === 2 && !gpu) gpuInfo().then(setGpu);
  }, [step, gpu]);

  const setLoc = (loc: Loc, src: "gps" | "city" | "manual") => {
    update({ loc, locSource: src });
    setStep(1);
  };

  const useGps = () => {
    if (!("geolocation" in navigator)) return setGeo("denied");
    setGeo("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ name: "Your location", lat: p.coords.latitude, lon: p.coords.longitude, elev: p.coords.altitude ?? 0, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }, "gps"),
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 },
    );
  };

  const manualOk = Number.isFinite(parseFloat(manual.lat)) && Math.abs(parseFloat(manual.lat)) <= 90 && Number.isFinite(parseFloat(manual.lon)) && Math.abs(parseFloat(manual.lon)) <= 180;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night text-star">
      <div className="mx-auto flex min-h-full w-full max-w-[640px] flex-col px-5 pb-10 pt-[calc(28px+env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Mark size={30} /><span className="t-display text-[22px]">Luna</span></span>
          <span className="t-label tnum text-star/50">{step + 1} / 3</span>
        </div>

        {step === 0 && (
          <section className="mt-[8vh]">
            <h1 className="t-display text-[clamp(52px,15vw,88px)] leading-[0.84]">Where are you<span className="t-script block text-[0.55em] normal-case">standing?</span></h1>
            <p className="t-body mt-5 text-star/70">Luna works out the sky for your exact spot. Your location stays on this device.</p>
            <div className="mt-8 flex flex-col gap-3">
              <Btn variant="torch" onClick={useGps} disabled={geo === "asking"}>
                <GLocate size={18} /> {geo === "asking" ? "Finding you…" : "Use my location"}
              </Btn>
              {geo === "denied" && <p className="t-label text-torch">Location is blocked or unavailable. Pick a place below instead.</p>}
            </div>
            <p className="t-label mt-10 text-star/55">Or start from a place</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CITIES.map((c) => (
                <button key={c.name} onClick={() => setLoc(c, "city")} className="rounded-xl border border-star/12 px-3 py-3 text-left transition-colors hover:border-star/40">
                  <span className="block text-[14px]">{c.name}</span>
                  <span className="t-label block text-star/40">{c.lat.toFixed(1)}°, {c.lon.toFixed(1)}°</span>
                </button>
              ))}
            </div>
            <p className="t-label mt-8 text-star/55">Or enter coordinates</p>
            <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (manualOk) setLoc({ name: `${parseFloat(manual.lat).toFixed(2)}°, ${parseFloat(manual.lon).toFixed(2)}°`, lat: parseFloat(manual.lat), lon: parseFloat(manual.lon), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }, "manual"); }}>
              <label className="flex flex-col gap-1"><span className="t-label text-star/45">Latitude</span><input inputMode="decimal" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} placeholder="32.78" className="w-28 border-b border-star/30 bg-transparent py-2 outline-none focus:border-star" /></label>
              <label className="flex flex-col gap-1"><span className="t-label text-star/45">Longitude</span><input inputMode="decimal" value={manual.lon} onChange={(e) => setManual({ ...manual, lon: e.target.value })} placeholder="78.96" className="w-28 border-b border-star/30 bg-transparent py-2 outline-none focus:border-star" /></label>
              <Btn type="submit" disabled={!manualOk}>Use these</Btn>
            </form>
          </section>
        )}

        {step === 1 && catalog && settings.loc && (
          <section className="mt-[6vh]">
            <h1 className="t-display text-[clamp(52px,15vw,88px)] leading-[0.84]">Look up<span className="t-script block text-[0.55em] normal-case">before anything else</span></h1>
            <div className="mt-6">
              <SkyCheck cat={catalog} date={now} loc={settings.loc} value={settings.limit} onPick={(m) => update({ limit: m })} />
            </div>
            {settings.limit !== null && (
              <p className="t-body mt-5 text-star/80">
                Your sky shows stars to about <span className="text-torch">magnitude {settings.limit}</span> (Bortle {bortleFor(settings.limit)}). Luna will only point at what you can see.
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="torch" disabled={settings.limit === null} onClick={() => setStep(2)}>Continue</Btn>
              <Btn variant="ghost" onClick={() => { update({ limit: 3.5 }); setStep(2); }}>Skip, assume a suburban sky</Btn>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-[6vh]">
            <h1 className="t-display text-[clamp(52px,15vw,88px)] leading-[0.84]">Choose a brain<span className="t-script block text-[0.55em] normal-case">it lives on this device</span></h1>
            <p className="t-body mt-5 text-star/70">Luna answers questions with Gemma, an open-weight model that runs inside this browser. It downloads once, then works with no signal. You can also skip this and choose later in Ask.</p>
            {gpu && !gpu.ok && <p className="t-body mt-4 text-torch">{gpu.reason} Everything else in Luna still works.</p>}
            <div className="mt-6 flex flex-col gap-2">
              {(Object.keys(TIERS) as Tier[]).map((t) => {
                const rec = gpu?.ok && suggestTier(gpu) === t;
                return (
                  <button key={t} disabled={!gpu?.ok} onClick={() => update({ tier: t })} aria-pressed={settings.tier === t} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-colors disabled:opacity-40 ${settings.tier === t ? "border-torch bg-white/[0.04]" : "border-star/15 hover:border-star/40"}`}>
                    <span>
                      <span className="t-display block text-[24px] leading-none">{TIERS[t].label}</span>
                      <span className="t-label mt-1 block text-star/50">{TIERS[t].note}{rec ? " · suggested here" : ""}</span>
                    </span>
                    <span className="t-label tnum text-star/60">{bytes(TIERS[t].bytes)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="torch" onClick={onDone}>{settings.tier ? "Open the sky" : "Skip for now"}</Btn>
            </div>
            {settings.tier && <p className="t-label mt-4 text-star/50">The download starts from Ask, on Wi-Fi if you can.</p>}
          </section>
        )}
      </div>
    </div>
  );
}
