"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Ridge } from "../Ridge";
import { LogoMark, Wordmark } from "../Logo";
import { Magnetic, Reveal, SectionHeading } from "../motion-bits";
import { IconCheck } from "../icons";

type State = "idle" | "sending" | "done" | "error";

export function Dawn() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setMsg("");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
      setState("done");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <section id="waitlist" className="relative z-10 mt-40 scroll-mt-10 md:mt-56">
      <div className="px-4 text-center sm:px-6">
        <SectionHeading plain="The night's nearly over." italic="Tomorrow, look up." />
        <p className="mx-auto mt-6 max-w-[520px] text-[1.05rem] leading-relaxed text-star-2">
          Luna is being built now. Leave your email and we&rsquo;ll write once, when it&rsquo;s ready for your phone.
        </p>

        <Reveal className="mx-auto mt-10 max-w-[520px]">
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass flex items-center gap-4 rounded-[20px] p-5 text-left">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-torch-soft text-torch-ink"><IconCheck size={22} /></span>
                <div>
                  <p className="font-medium">You&rsquo;re on the list.</p>
                  <p className="text-[0.88rem] text-star-2">One email when Luna is ready. Clear skies until then.</p>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, y: -8 }} className="glass flex flex-col gap-2 rounded-[20px] p-2 sm:flex-row" noValidate>
                <label htmlFor="wl-email" className="sr-only">Email address</label>
                <input
                  id="wl-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field min-w-0 flex-1 !border-transparent !bg-transparent !shadow-none"
                />
                <Magnetic strength={0.15}>
                  <button type="submit" disabled={state === "sending"} className="btn-torch w-full justify-center disabled:opacity-70 sm:w-auto">
                    {state === "sending" ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#160807]/30 border-t-[#160807]" /> Joining…
                      </>
                    ) : (
                      "Join the waitlist"
                    )}
                  </button>
                </Magnetic>
              </motion.form>
            )}
          </AnimatePresence>
          <p role="status" className="mt-3 min-h-5 text-[0.85rem] text-torch-ink">{state === "error" ? msg : ""}</p>
        </Reveal>
      </div>

      {/* Footer, set into the dawn ridgeline */}
      <footer className="relative mt-20 overflow-hidden">
        <Ridge tone="dawn" className="block h-[260px] w-full sm:h-[340px]" />
        <div className="relative -mt-px bg-[#110d12] px-4 pb-10 pt-4 sm:px-6">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <a href="#top" className="flex items-center gap-2.5" aria-label="Back to top">
                <LogoMark size={34} />
                <Wordmark className="text-[2rem] leading-none" />
              </a>
              <p className="mt-3 max-w-[340px] text-[0.9rem] text-star-3">A sky guide for places with no signal. Made for dark skies.</p>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9rem] text-star-2">
              <a className="hover:text-star" href="#story">How it works</a>
              <a className="hover:text-star" href="#tonight">Tonight</a>
              <a className="hover:text-star" href="#places">Dark places</a>
              <a className="hover:text-star" href="#yours">Your stars</a>
              <a className="hover:text-star" href="#any-night">Any night</a>
              <a className="hover:text-star" href="#waitlist">Waitlist</a>
            </nav>
          </div>
          <div className="mx-auto mt-10 flex max-w-[1240px] flex-col gap-2 border-t border-white/10 pt-6 text-[0.75rem] text-star-3 sm:flex-row sm:justify-between">
            <p>© {2026} Luna</p>
            <p>
              Sky positions computed with <a className="underline-offset-4 hover:underline" href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener noreferrer">Astronomy Engine</a>. Forecasts by <a className="underline-offset-4 hover:underline" href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>.
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}
