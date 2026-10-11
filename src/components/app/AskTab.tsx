"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIERS, cancelGeneration, downloadModel, formatPrompt, generate, gpuInfo, isCached, loadModel, loaded, removeModel, suggestTier, type GpuInfo, type Tier } from "@/lib/brain";
import { SYSTEM, buildFacts, dirWord, userPrompt, verify, type Verdict } from "@/lib/ground";
import { usePointer } from "./Shell";
import { useApp } from "./store";
import { Btn, GCheck, GMic, GSend, Heading, Panel, bytes } from "./ui";

type Msg =
  | { role: "you"; text: string }
  | { role: "luna"; text: string; source: "model" | "engine"; model?: string; ms?: number; verdict?: Verdict; raw?: string; facts: string[]; streaming?: boolean };

type BrainState = "checking" | "no-gpu" | "pick" | "absent" | "downloading" | "cached" | "loading" | "ready" | "error";

type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };

const clock = () => performance.now();

const SUGGEST = ["What's that bright one?", "When is it darkest tonight?", "Where is Jupiter?", "Is the Moon up?"];

export function AskTab() {
  const { sky, catalog, loc, night, nicknames, settings, update } = useApp();
  const pointer = usePointer();
  const [gpu, setGpu] = useState<GpuInfo | null>(null);
  const [brain, setBrain] = useState<BrainState>("checking");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const tier = settings.tier;

  // what can this device run, and is the chosen model already here?
  useEffect(() => {
    let live = true;
    (async () => {
      const g = await gpuInfo();
      if (!live) return;
      setGpu(g);
      if (!g.ok) return setBrain("no-gpu");
      if (!tier) return setBrain("pick");
      if (loaded() === tier) return setBrain("ready");
      setBrain((await isCached(tier)) ? "cached" : "absent");
    })();
    return () => {
      live = false;
    };
  }, [tier]);

  // a question handed over from the sky ("Ask Luna about it")
  useEffect(() => {
    try {
      const pre = sessionStorage.getItem("luna-ask");
      if (pre) {
        sessionStorage.removeItem("luna-ask");
        setTimeout(() => setQ(pre), 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const download = async () => {
    if (!tier) return;
    setError("");
    setBrain("downloading");
    abort.current = new AbortController();
    try {
      await downloadModel(tier, (done, total) => setProgress({ done, total }), abort.current.signal);
      setBrain("cached");
      await wake();
    } catch (e) {
      if ((e as Error).name === "AbortError") return setBrain("absent");
      setError(e instanceof Error ? e.message : "Download failed.");
      setBrain("error");
    }
  };

  const wake = async () => {
    if (!tier) return;
    setError("");
    setBrain("loading");
    try {
      await loadModel(tier);
      setBrain("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The model failed to start on this device.");
      setBrain("error");
    }
  };

  const speak = useCallback(
    (text: string) => {
      if (!settings.speak || !("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      speechSynthesis.speak(u);
    },
    [settings.speak],
  );

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || !sky || busy) return;
    setQ("");
    const pointing = pointer.state === "live" ? pointer.pointing : null;
    const facts = buildFacts(text, sky, catalog, loc, night, pointing, nicknames, settings.limit ?? 4.5);
    setMsgs((m) => [...m, { role: "you", text }]);
    if (brain !== "ready" || !tier) {
      setMsgs((m) => [...m, { role: "luna", text: facts.deterministic, source: "engine", facts: facts.lines }]);
      speak(facts.deterministic);
      return;
    }
    setBusy(true);
    const t0 = clock();
    setMsgs((m) => [...m, { role: "luna", text: "", source: "model", model: TIERS[tier].label, facts: facts.lines, streaming: true }]);
    const patch = (p: Partial<Extract<Msg, { role: "luna" }>>) =>
      setMsgs((m) => {
        const c = [...m];
        const last = c[c.length - 1];
        if (last && last.role === "luna") c[c.length - 1] = { ...last, ...p };
        return c;
      });
    try {
      const raw = await generate(formatPrompt(tier, SYSTEM, userPrompt(text, facts)), (partial) => patch({ text: partial }));
      const clean = raw.replace(/<\|?\/?(start_of_turn|end_of_turn|turn|im_start|im_end)\|?>/g, "").replace(/<turn\|>|<\|turn>/g, "").trim();
      const v = verify(clean, facts, sky, loc.tz);
      patch({ text: v.final, raw: clean, verdict: v, ms: Math.round(clock() - t0), streaming: false });
      speak(v.final);
    } catch (e) {
      patch({ text: facts.deterministic, source: "engine", streaming: false });
      setError(e instanceof Error ? e.message : "The model stopped.");
    } finally {
      setBusy(false);
    }
  };

  const Rec = typeof window !== "undefined" ? ((window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition) : undefined;
  const listen = () => {
    if (!Rec || listening) return;
    const r = new Rec();
    r.lang = navigator.language || "en-IN";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      if (said) ask(said);
    };
    r.onerror = (e) => setError(e.error === "network" ? "Voice needs a signal on this browser. Typing works offline." : `Voice input stopped (${e.error}).`);
    r.onend = () => setListening(false);
    setListening(true);
    setError("");
    r.start();
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={list} className="flex-1 overflow-y-auto">
        <Panel className="!pb-6">
          <Heading plain="Ask" script="what you're looking at" />

          {/* the brain */}
          <div className="mt-6 rounded-2xl border border-star/12 p-4">
            {brain === "checking" && <p className="t-label text-star/60">Checking what this device can run…</p>}
            {brain === "no-gpu" && (
              <p className="t-body text-star/75">{gpu?.reason} Luna will answer from its sky engine instead: exact positions and times, in plain words, with no model.</p>
            )}
            {brain === "pick" && gpu && (
              <div>
                <p className="t-body text-star/75">Choose which Gemma runs on this device. It downloads once.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {(Object.keys(TIERS) as Tier[]).map((t) => (
                    <button key={t} onClick={() => update({ tier: t })} className="flex items-center justify-between rounded-xl border border-star/15 px-4 py-3 text-left hover:border-star/40">
                      <span>
                        <span className="t-display block text-[20px] leading-none">{TIERS[t].label}</span>
                        <span className="t-label block text-star/45">{TIERS[t].note}{suggestTier(gpu) === t ? " · suggested" : ""}</span>
                      </span>
                      <span className="t-label text-star/55">{bytes(TIERS[t].bytes)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tier && (brain === "absent" || brain === "error") && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="t-display text-[22px] leading-none">{TIERS[tier].label}</p>
                  <p className="t-label text-star/50">{bytes(TIERS[tier].bytes)} · downloads once, then works offline</p>
                </div>
                <div className="flex gap-2">
                  <Btn variant="torch" onClick={download}>Download</Btn>
                  <Btn variant="ghost" onClick={() => update({ tier: null })}>Change</Btn>
                </div>
              </div>
            )}
            {tier && brain === "downloading" && (
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="t-display text-[22px] leading-none">{TIERS[tier].label}</p>
                  <p className="t-label tnum text-star/70">{bytes(progress.done)} / {bytes(progress.total || TIERS[tier].bytes)} · {pct}%</p>
                </div>
                <div className="mt-3 h-px w-full bg-star/15"><div className="h-px bg-torch transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
                <div className="mt-3"><Btn variant="ghost" onClick={() => abort.current?.abort()}>Cancel</Btn></div>
              </div>
            )}
            {tier && brain === "cached" && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="t-body text-star/75">{TIERS[tier].label} is on this device.</p>
                <Btn variant="torch" onClick={wake}>Wake Luna</Btn>
              </div>
            )}
            {tier && brain === "loading" && <p className="t-label text-star/70">Loading {TIERS[tier].label} onto the GPU…</p>}
            {tier && brain === "ready" && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="t-label flex items-center gap-2 text-star/80"><span className="h-1.5 w-1.5 rounded-full bg-torch" />{TIERS[tier].label} · running on this device</p>
                <Btn variant="ghost" onClick={async () => { await removeModel(tier); update({ tier: null }); location.reload(); }}>Remove</Btn>
              </div>
            )}
            {error && <p className="t-label mt-3 text-torch">{error}</p>}
          </div>

          {pointer.state === "live" && pointer.pointing && (
            <p className="t-label mt-4 text-star/55">Using your phone&rsquo;s direction: {Math.round(pointer.pointing.az)}° {dirWord(pointer.pointing.az)}, {Math.round(pointer.pointing.alt)}° up</p>
          )}

          {/* conversation */}
          <div className="mt-6 flex flex-col gap-5">
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGEST.map((s) => (
                  <button key={s} onClick={() => ask(s)} className="rounded-full border border-star/20 px-4 py-2 text-[14px] text-star/80 hover:border-star/50">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "you" ? (
                <p key={i} className="max-w-[85%] self-end rounded-2xl border border-star/15 px-4 py-2.5 text-[16px] text-star/85">{m.text}</p>
              ) : (
                <div key={i} className="max-w-[92%]">
                  <p className="text-[clamp(20px,5.4vw,24px)] leading-[1.3] tracking-[-0.01em]" style={{ fontFamily: "var(--serif)", fontVariationSettings: '"wdth" 80' }}>{m.text || <span className="text-star/40">Thinking…</span>}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="t-label text-star/45">{m.source === "model" ? `${m.model} · on device${m.ms ? ` · ${(m.ms / 1000).toFixed(1)} s` : ""}` : "Sky engine · no model"}</span>
                    {m.verdict?.status === "checked" && <span className="t-label flex items-center gap-1 text-[#8fb39a]"><GCheck size={13} /> Checked against the sky</span>}
                    {m.verdict?.status === "corrected" && <span className="t-label text-torch">Corrected by the sky engine</span>}
                  </div>
                  <details className="mt-2">
                    <summary className="t-label cursor-pointer text-star/40">How Luna answered</summary>
                    <ul className="t-body mt-2 list-disc space-y-1 pl-5 text-[13px] text-star/55">
                      {m.facts.map((f, k) => <li key={k}>{f}</li>)}
                    </ul>
                    {m.verdict?.status === "corrected" && (
                      <div className="mt-2 text-[13px] text-star/55">
                        <p className="t-label text-torch/80">What the model said</p>
                        <p className="t-body mt-1">{m.raw}</p>
                        <p className="t-label mt-2 text-torch/80">Why it was replaced</p>
                        <ul className="t-body list-disc pl-5">{m.verdict.issues.map((x, k) => <li key={k}>{x}</li>)}</ul>
                      </div>
                    )}
                  </details>
                </div>
              ),
            )}
          </div>
        </Panel>
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="mx-auto mb-[calc(80px+env(safe-area-inset-bottom,0px))] flex w-full max-w-[640px] items-center gap-2 px-4"
      >
        {Rec && (
          <button type="button" onClick={listen} aria-label="Ask out loud" className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${listening ? "border-torch bg-torch/20 text-torch" : "border-star/25 text-star/80"}`}>
            <GMic size={20} />
          </button>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={listening ? "Listening…" : "Ask about the sky"} className="h-12 min-w-0 flex-1 rounded-full border border-star/20 bg-night/80 px-5 text-[16px] outline-none placeholder:text-star/35 focus:border-star/60" />
        {busy ? (
          <Btn onClick={cancelGeneration}>Stop</Btn>
        ) : (
          <button type="submit" aria-label="Send" disabled={!q.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-torch text-night disabled:opacity-40">
            <GSend size={20} />
          </button>
        )}
      </form>
    </div>
  );
}
