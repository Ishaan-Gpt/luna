"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { fmtTime, HANLE, tonight, type Night } from "@/lib/sky";
import { scrollToTarget } from "./LunaMotion";
import { ArrowUp, Mark, VineB } from "./primitives";

const CREDITS: [string, string, string][] = [
  ["Gemma 4", "Apache 2.0", "https://ai.google.dev/gemma"],
  ["Astronomy Engine", "MIT", "https://github.com/cosinekitty/astronomy"],
  ["Open-Meteo", "CC BY 4.0", "https://open-meteo.com"],
  ["Made in 2026", "Hacktoberfest", "https://dev.to/challenges/hacktoberfest-week1-2026-10-05"],
];

/** The open pieces Luna stands on, with their real licences. */
export function Credits() {
  return (
    <section data-bg="light" className="relative overflow-hidden bg-paper pb-[18vh] pt-[16vh] text-ink">
      <div data-drift="-50" className="pointer-events-none absolute -right-[8vw] top-[10vh] w-[30vw] max-lg:w-[58vw]">
        <VineB className="h-auto w-full" />
      </div>
      <div className="gut relative flex flex-col items-center text-center" data-reveal-group>
        <p data-reveal="ctn" className="t-label max-w-[30ch]">A night to come back to, night after night</p>
        <span data-reveal="line" className="vline mt-6 block h-[14vh]" />
        <ul className="mt-[8vh] grid gap-[1.2vw]">
          {CREDITS.map(([name, lic, href]) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer" data-reveal="h" className="t-display t-h4 transition-opacity hover:opacity-60 max-lg:!text-[11vw]">
                {name}
                <sup className="lic">{lic}</sup>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type FormState = "idle" | "sending" | "done" | "error";

export function Footer() {
  const [night, setNight] = useState<Night | null>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setNight(tonight(new Date(), HANLE)), 0);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Something went wrong. Try again?");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Try again?");
    }
  };

  const darkWindow = night?.darkStart && night.darkEnd ? `${fmtTime(night.darkStart, HANLE.tz)}—${fmtTime(night.darkEnd, HANLE.tz)}` : "--:--—--:--";

  return (
    <footer id="waitlist">
      {/* call to action over first light */}
      <div data-bg="dark" className="relative h-[80vh] overflow-hidden bg-night text-star" data-parallax="w">
        <img src="/art/dawn-ridge.webp" alt="First light over the ridges, one bright planet still up" data-parallax="img" data-amount="8" className="absolute inset-0 h-[116%] w-full -translate-y-[7%] object-cover" />
        <div className="absolute inset-0 grid place-items-center text-center" data-reveal-group>
          <div>
            <p data-reveal="a" className="t-script text-[9vw] max-lg:text-[18vw]">see you tonight</p>
            <a href="#join" className="t-label ulink mt-4 inline-block">Join the waitlist</a>
          </div>
        </div>
      </div>

      <div data-bg="ember" className="relative bg-ember pb-10 pt-[14vh] text-star">
        <div className="gut flex flex-col items-center text-center" data-reveal-group>
          <span data-reveal="ctn"><Mark size={46} /></span>
          <p data-reveal="h" className="t-display tnum mt-[6vh] text-[11vw] leading-[0.82] max-lg:text-[17vw]">{darkWindow}</p>
          <p data-reveal="ctn" className="t-label mt-6 text-star/65">Tonight&rsquo;s truly dark hours · Hanle, Ladakh</p>

          <form id="join" onSubmit={submit} noValidate className="mt-[9vh] flex w-full max-w-[520px] flex-col items-center gap-5" data-reveal="ctn">
            {state === "done" ? (
              <p className="t-display t-h6 max-lg:!text-[7vw]">You&rsquo;re on the list. Clear skies.</p>
            ) : (
              <>
                <label htmlFor="wl-email" className="t-label text-star/70">One email, when Luna is ready for your phone</label>
                <div className="flex w-full items-end gap-4 border-b border-star/40 pb-2 focus-within:border-star">
                  <input
                    id="wl-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="t-body min-w-0 flex-1 bg-transparent py-2 text-[clamp(15px,1.1vw,18px)] text-star outline-none placeholder:text-star/35"
                  />
                  <button type="submit" disabled={state === "sending"} className="t-label shrink-0 py-2 disabled:opacity-60">
                    {state === "sending" ? "Joining…" : "Join"}
                  </button>
                </div>
                <p role="status" className="t-label min-h-[1.4em] text-torch">{state === "error" ? error : ""}</p>
              </>
            )}
          </form>
        </div>

        <div className="gut mt-[12vh] flex flex-wrap items-end justify-between gap-6 border-t border-star/15 pt-6">
          <button onClick={() => scrollToTarget(0)} className="t-label flex items-center gap-3 opacity-80 hover:opacity-100">
            <ArrowUp size={16} /> To the top
          </button>
          <p className="t-label text-center text-star/55">Your location never leaves your phone</p>
          <p className="t-label text-right text-star/55">Luna © 2026 · Made for dark places</p>
        </div>
      </div>
    </footer>
  );
}
