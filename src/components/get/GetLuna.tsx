"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { APK, chooseDesktopPreview, detectPlatform, type Platform } from "@/lib/platform";
import { Mark } from "../landing/primitives";

type InstallEvt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * How to get Luna onto this device. Android gets the APK (and Chrome's one-tap install),
 * iPhone gets Safari's Add to Home Screen, and a computer is told plainly that Luna is a
 * phone app, with a QR code to carry it over and an honest preview.
 */
export function GetLuna({ mode = "page", onPreview }: { mode?: "page" | "gate"; onPreview?: () => void }) {
  const [p, setP] = useState<Platform | null>(null);

  useEffect(() => {
    const d = detectPlatform();
    if (d.installed && mode === "page") {
      location.replace("/sky");
      return;
    }
    setTimeout(() => setP(d), 0);
  }, [mode]);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-night text-star">
      <img src="/art/tent-stars.webp" alt="" aria-hidden className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-35" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-night/70 via-night/80 to-night" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-5 pb-[calc(40px+env(safe-area-inset-bottom,0px))] pt-[calc(18px+env(safe-area-inset-top,0px))] sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Luna home">
            <Mark size={30} />
            <span className="t-display text-[22px] leading-none">Luna</span>
          </Link>
          {mode === "page" && p && p.os !== "desktop" && (
            <a href="/sky" className="t-label ulink text-star/70">
              Use it in the browser
            </a>
          )}
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          {!p ? <p className="t-label text-star/50">Checking your device…</p> : p.os === "android" ? <Android /> : p.os === "ios" ? <Iphone safari={p.safari} /> : <Desktop mode={mode} onPreview={onPreview} />}
        </div>
      </div>
    </main>
  );
}

/* ---------- Android ---------- */

function Android() {
  const apk = useApk();
  const [evt, setEvt] = useState<InstallEvt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvt);
    };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", h);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  const chromeInstall = async () => {
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setEvt(null);
  };

  return (
    <section className="mx-auto w-full max-w-[560px]">
      <h1 className="t-display text-[clamp(52px,15vw,96px)] leading-[0.86]">Luna for Android</h1>
      <p className="t-body mt-5 text-star/75">A real app on your home screen. Hold it up to the sky, ask what you&rsquo;re seeing, and find darker places. After the first launch it works with no signal.</p>

      {installed ? (
        <div className="mt-8 rounded-2xl border border-star/20 p-5">
          <p className="t-display text-[28px] leading-none">Luna is installed.</p>
          <p className="t-body mt-2 text-star/70">Open it from your home screen or app drawer.</p>
        </div>
      ) : (
        <>
          {apk.state !== "missing" && (
            <>
              <a href={APK.href} download="Luna.apk" className="mt-8 flex min-h-14 w-full items-center justify-between gap-4 whitespace-nowrap rounded-full bg-torch px-6 text-night transition-colors hover:bg-[#ef6a52]">
                <span className="t-label !text-[13px]">Download Luna</span>
                <span className="t-label tnum !text-[11px] opacity-75">{apk.size ? `${(apk.size / 1048576).toFixed(1)} MB` : "APK"}</span>
              </a>
              <p className="t-label mt-3 text-center text-star/45">Android 7 or newer · version {APK.version} · runs on Chrome</p>
            </>
          )}

          {apk.state !== "missing" && (
            <ol className="mt-7 grid gap-4">
              <Step n={1}>Tap Download. Your browser may warn about installing apps from outside the Play Store: Luna&rsquo;s full source is public on GitHub.</Step>
              <Step n={2}>Open the downloaded file. If Android asks, allow your browser to install apps, then tap Install.</Step>
              <Step n={3}>Open Luna and allow location and motion. The first launch needs a connection; after that it works offline.</Step>
            </ol>
          )}

          <div className="mt-8 border-t border-star/15 pt-6">
            {evt ? (
              <button onClick={chromeInstall} className="t-label inline-flex min-h-12 items-center rounded-full border border-star/40 px-5 hover:bg-star hover:text-night">
                {apk.state === "missing" ? "Install Luna" : "Or install from Chrome, no download"}
              </button>
            ) : (
              <p className="t-body text-star/65">{apk.state === "missing" ? "Install from Chrome: " : "Prefer not to download an APK? In Chrome: "}open the menu <b className="font-medium text-star">⋮</b> and tap <b className="font-medium text-star">Install app</b> or <b className="font-medium text-star">Add to Home screen</b>.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function useApk() {
  const [s, setS] = useState<{ state: "checking" | "ok" | "missing"; size: number | null }>({ state: "checking", size: null });
  useEffect(() => {
    fetch(APK.href, { method: "HEAD", cache: "no-store" })
      .then((r) => setS(r.ok ? { state: "ok", size: Number(r.headers.get("content-length")) || null } : { state: "missing", size: null }))
      .catch(() => setS({ state: "missing", size: null }));
  }, []);
  return s;
}

/* ---------- iPhone ---------- */

function Iphone({ safari }: { safari: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {}
  };
  return (
    <section className="mx-auto w-full max-w-[560px]">
      <h1 className="t-display text-[clamp(52px,15vw,96px)] leading-[0.86]">Luna for iPhone</h1>
      <p className="t-body mt-5 text-star/75">Apple only allows app downloads from the App Store, so Luna installs from Safari instead. It gets its own icon, opens full screen and works offline after the first launch.</p>

      {!safari && (
        <div className="mt-7 rounded-2xl border border-torch/60 p-5">
          <p className="t-body">Only Safari can add Luna to your home screen. Copy this link and open it in Safari.</p>
          <button onClick={copy} className="t-label mt-4 inline-flex min-h-11 items-center rounded-full border border-star/40 px-5 hover:bg-star hover:text-night">
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}

      <ol className="mt-8 grid gap-5">
        <Step n={1}>
          Tap <GShare /> <b className="font-medium">Share</b> in Safari&rsquo;s toolbar.
        </Step>
        <Step n={2}>
          Scroll down and tap <GAdd /> <b className="font-medium">Add to Home Screen</b>, then <b className="font-medium">Add</b>.
        </Step>
        <Step n={3}>Open Luna from your home screen and allow location and motion.</Step>
      </ol>

      <p className="t-body mt-8 text-[14px] text-star/55">Ask runs Gemma 4 on your phone&rsquo;s GPU where Safari supports WebGPU and there is enough memory. Otherwise Luna answers from its sky engine and says so.</p>
    </section>
  );
}

/* ---------- Computer ---------- */

function Desktop({ mode, onPreview }: { mode: "page" | "gate"; onPreview?: () => void }) {
  const router = useRouter();
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = `${location.origin}/get`;
    QRCode.toString(u, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#f3f1ea", light: "#00000000" } })
      .then((svg) => {
        setQr(svg);
        setUrl(u.replace(/^https?:\/\//, ""));
      })
      .catch(() => setUrl(u));
  }, []);

  const preview = () => {
    chooseDesktopPreview();
    if (onPreview) onPreview();
    else router.push("/sky");
  };

  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
      <div>
        <h1 className="t-display text-[clamp(52px,7.4vw,118px)] leading-[0.86]">Luna lives on your phone</h1>
        <p className="t-body mt-6 max-w-[54ch] text-star/75">
          Luna works by holding your phone up to the sky. The compass and tilt sensors tell it where you&rsquo;re pointing, GPS tells it where you&rsquo;re standing, and it&rsquo;s meant to be used outside, in the dark. A computer has none of that, so here Luna can only be a preview.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="t-label text-star">Works in the preview</p>
            <ul className="t-body mt-3 grid gap-1.5 text-star/70">
              <li>The live sky map: drag to look, scroll to zoom</li>
              <li>Tonight: dark hours, moon, weather, events</li>
              <li>Ask, with Gemma 4 in Chrome or Edge</li>
              <li>Places, marks and nicknames</li>
            </ul>
          </div>
          <div>
            <p className="t-label text-torch">Needs your phone</p>
            <ul className="t-body mt-3 grid gap-1.5 text-star/70">
              <li>Pointing at the sky to find things</li>
              <li>Your exact location from GPS</li>
              <li>Walking to a dark site with the compass</li>
              <li>Rise alerts while you&rsquo;re outside</li>
            </ul>
          </div>
        </div>

        <button onClick={preview} className="t-label mt-10 inline-flex min-h-12 items-center rounded-full border border-star/40 px-6 transition-colors hover:bg-star hover:text-night">
          {mode === "gate" ? "Preview on this computer" : "Open the preview"}
        </button>
      </div>

      <div className="mx-auto w-full max-w-[380px] rounded-[28px] border border-star/15 bg-night/60 p-8 text-center backdrop-blur-md">
        <div className="mx-auto aspect-square w-full max-w-[240px] [&_svg]:h-full [&_svg]:w-full" role="img" aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="t-display mt-7 text-[30px] leading-none">Scan with your phone</p>
        <p className="t-label tnum mt-3 break-all text-star/55">{url}</p>
        <div className="mt-7 grid gap-2 border-t border-star/12 pt-6 text-left">
          <p className="t-body text-star/70"><b className="font-medium text-star">Android:</b> download the app.</p>
          <p className="t-body text-star/70"><b className="font-medium text-star">iPhone:</b> add it to your home screen from Safari.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- bits ---------- */

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[34px_1fr] items-start gap-3">
      <span className="t-label tnum grid h-[34px] w-[34px] place-items-center rounded-full border border-star/30 text-star/80">{n}</span>
      <p className="t-body pt-1.5 text-star/80">{children}</p>
    </li>
  );
}

/** Safari's share glyph, drawn in Luna's hand. */
function GShare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-0.5 inline -translate-y-0.5" aria-hidden>
      <path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16" />
      <path d="M12 3v11M8.5 6.5 12 3l3.5 3.5" />
    </svg>
  );
}

function GAdd() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-0.5 inline -translate-y-0.5" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}
