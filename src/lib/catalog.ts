"use client";

import { useEffect, useState } from "react";

/**
 * Luna's offline sky catalogue: 5,000 Hipparcos stars to magnitude 6.2, all 88 constellation figures,
 * proper names and the brightest deep-sky objects. Built by scripts/build-catalog.mjs from d3-celestial
 * data (BSD-3-Clause). Fetched once, then served from the offline cache.
 */
export type CatStar = [ra: number, dec: number, mag: number, tint: number, hip: number];
export type Catalog = {
  stars: CatStar[];
  names: Record<string, { n: string; c: string }>;
  lines: Record<string, [number, number][][]>;
  cons: { id: string; name: string; rank: number; ra: number; dec: number }[];
  dsos: { id: string; name: string; type: string; mag: number; ra: number; dec: number }[];
};

export const TINTS = ["#d6e4ff", "#f7f4ec", "#fff0cc", "#ffd5a6", "#ffb593"];

let cache: Catalog | null = null;
let pending: Promise<Catalog> | null = null;

export function loadCatalog(): Promise<Catalog> {
  if (cache) return Promise.resolve(cache);
  pending ??= fetch("/data/sky-catalog.json")
    .then((r) => {
      if (!r.ok) throw new Error(`catalogue ${r.status}`);
      return r.json();
    })
    .then((c: Catalog) => (cache = c));
  return pending;
}

export function useCatalog() {
  const [cat, setCat] = useState<Catalog | null>(cache);
  useEffect(() => {
    if (cat) return;
    let live = true;
    loadCatalog().then((c) => live && setCat(c)).catch(() => {});
    return () => {
      live = false;
    };
  }, [cat]);
  return cat;
}

export const conName = (cat: Catalog | null, id: string) => cat?.cons.find((c) => c.id === id)?.name ?? id;
