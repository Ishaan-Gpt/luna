"use client";

import { useEffect, useState } from "react";

/** The ElevenLabs story pack (public/voice), rendered at build time and cached for offline play. */
export type VoicePack = { voice: string; source: string; stories: Record<string, { name: string; text: string; file: string }> };

let pack: VoicePack | null | undefined;
let pending: Promise<VoicePack | null> | null = null;

export function loadVoicePack() {
  if (pack !== undefined) return Promise.resolve(pack);
  pending ??= fetch("/voice/manifest.json")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((p: VoicePack | null) => {
      pack = p;
      // warm the offline cache so every story plays with no signal later
      if (p) Object.values(p.stories).forEach((s) => fetch(s.file).catch(() => {}));
      return p;
    });
  return pending;
}

export function useVoicePack() {
  const [p, setP] = useState<VoicePack | null>(pack ?? null);
  useEffect(() => {
    let live = true;
    loadVoicePack().then((v) => live && setP(v));
    return () => {
      live = false;
    };
  }, []);
  return p;
}

let current: HTMLAudioElement | null = null;
export function playStory(file: string, onEnd?: () => void) {
  current?.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  current = new Audio(file);
  current.onended = () => onEnd?.();
  current.play().catch(() => onEnd?.());
  return () => {
    current?.pause();
    onEnd?.();
  };
}
export function stopStory() {
  current?.pause();
}
