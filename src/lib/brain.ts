"use client";

/*
 * Luna's on-device brain: open-weight Gemma models run in the browser on WebGPU through MediaPipe's
 * LLM Inference runtime (self-hosted under /mediapipe/wasm). Models download once from Hugging Face
 * into the browser's Cache Storage and load from there afterwards, with or without a signal.
 */

import type { LlmInference } from "@mediapipe/tasks-genai";

export type Tier = "full";
type Family = "gemma4";

/*
 * Luna ships one brain: Gemma 4 E2B, Google's open model (Apache 2.0, ungated, so anyone can download it
 * without an account). Devices without WebGPU, or without the memory for it, get answers straight from
 * the sky engine instead, and the app says so.
 */
export const TIERS: Record<Tier, { label: string; note: string; bytes: number; url: string; family: Family; maxTokens: number; licence: string }> = {
  full: {
    label: "Gemma 4 · E2B",
    note: "Google's open model · best on a laptop, or a recent phone with plenty of memory",
    bytes: 2_003_697_664,
    url: "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task",
    family: "gemma4",
    maxTokens: 1536,
    licence: "Apache 2.0",
  },
};

export const isTier = (t: unknown): t is Tier => t === "full";

const CACHE = "luna-models-v1";

export type GpuInfo = { ok: boolean; reason?: string; maxBuffer?: number; desc?: string };
export async function gpuInfo(): Promise<GpuInfo> {
  const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ limits: { maxBufferSize: number }; info?: { vendor?: string; architecture?: string } } | null> } };
  if (!nav.gpu) return { ok: false, reason: "This browser has no WebGPU. Try Chrome or Edge, or Safari 26 on iPhone." };
  try {
    const a = await nav.gpu.requestAdapter();
    if (!a) return { ok: false, reason: "WebGPU is present but no graphics adapter is available." };
    return { ok: true, maxBuffer: a.limits.maxBufferSize, desc: [a.info?.vendor, a.info?.architecture].filter(Boolean).join(" ") };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "WebGPU failed to start." };
  }
}

/** A sensible default for this device. */
export function suggestTier(g: GpuInfo): Tier {
  void g;
  return "full";
}

export async function isCached(tier: Tier) {
  try {
    const c = await caches.open(CACHE);
    return !!(await c.match(TIERS[tier].url));
  } catch {
    return false;
  }
}

export async function removeModel(tier: Tier) {
  const c = await caches.open(CACHE);
  await c.delete(TIERS[tier].url);
}

export async function storageEstimate() {
  try {
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  } catch {
    return null;
  }
}

/** Download a model into Cache Storage, reporting progress. Streams to disk, never all in memory. */
export async function downloadModel(tier: Tier, onProgress: (done: number, total: number) => void, signal?: AbortSignal) {
  try {
    await navigator.storage?.persist?.();
  } catch {}
  const { url, bytes } = TIERS[tier];
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}). Check your connection and try again.`);
  const total = Number(res.headers.get("content-length")) || bytes;
  const [toCache, toCount] = res.body.tee();
  const counting = (async () => {
    const r = toCount.getReader();
    let done = 0;
    for (;;) {
      const { value, done: end } = await r.read();
      if (end) break;
      done += value.byteLength;
      onProgress(done, total);
    }
  })();
  const c = await caches.open(CACHE);
  await Promise.all([c.put(url, new Response(toCache, { headers: { "content-type": "application/octet-stream", "content-length": String(total) } })), counting]);
}

let llm: LlmInference | null = null;
let loadedTier: Tier | null = null;

export const loaded = () => loadedTier;

export async function loadModel(tier: Tier) {
  if (llm && loadedTier === tier) return;
  if (llm) {
    llm.close();
    llm = null;
    loadedTier = null;
  }
  const c = await caches.open(CACHE);
  const hit = await c.match(TIERS[tier].url);
  if (!hit?.body) throw new Error("The model isn't downloaded on this device yet.");
  const { FilesetResolver, LlmInference } = await import("@mediapipe/tasks-genai");
  const files = await FilesetResolver.forGenAiTasks("/mediapipe/wasm");
  llm = await LlmInference.createFromOptions(files, {
    baseOptions: { modelAssetBuffer: hit.body.getReader() },
    maxTokens: TIERS[tier].maxTokens,
    topK: 40,
    temperature: 0.4,
    randomSeed: 11,
  });
  loadedTier = tier;
}

export function unloadModel() {
  llm?.close();
  llm = null;
  loadedTier = null;
}

/** Wrap a system brief and a question in the right chat format for the loaded family. */
export function formatPrompt(tier: Tier, system: string, user: string) {
  void tier; // one family today (Gemma 4); add a branch here if another model is added
  return `<|turn>system\n${system}<turn|>\n<|turn>user\n${user}<turn|>\n<|turn>model\n`;
}

/** Stream a response. Resolves with the full text. */
export async function generate(prompt: string, onPartial: (text: string) => void): Promise<string> {
  if (!llm) throw new Error("No model is loaded.");
  let text = "";
  await llm.generateResponse(prompt, (partial: string) => {
    text += partial;
    onPartial(text);
  });
  return text;
}

export function cancelGeneration() {
  try {
    llm?.cancelProcessing();
  } catch {}
}
