// Luna — procedural night photography.
// Builds night scenes (stars, Milky Way, ridgelines, a city terrace, a lake) from SVG primitives and
// rasterises them to WebP with sharp, so the page ships static images instead of live filters.
//
//   node scripts/render-night.mjs [scene ...]   → public/art/*.webp (all scenes, or just the named ones)
//
// Every file can later be swapped for a real photograph with the same name and aspect ratio.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public/art");

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => n.toFixed(1);
const TINTS = ["#d9e6ff", "#f7f4ec", "#f7f4ec", "#f7f4ec", "#fff0cc", "#ffd9ad", "#ffbfa0"];

/* ---------- building blocks ---------- */

function defs(extra = "") {
  return `<defs>
  <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="blur60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
  </filter>
  <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  ${extra}
</defs>`;
}

function sky(w, h, stops, id = "sky") {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;
}

/** Star field. density = stars per megapixel; limit 0..1 trims faint stars (city skies). */
function stars(w, h, seed, { density = 2600, limit = 1, maxY = 1, bright = 26 } = {}) {
  const r = rng(seed);
  const n = Math.round((w * h * density) / 1e6);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = Math.pow(r(), 1.15) * h * maxY;
    const m = Math.pow(r(), 3.2); // most stars faint
    if (m > limit) continue;
    const rad = 0.35 + m * 1.6;
    const o = 0.25 + m * 0.75;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${rad.toFixed(2)}" fill="${TINTS[Math.floor(r() * TINTS.length)]}" opacity="${o.toFixed(2)}"/>`;
  }
  // a handful of bright stars with soft halos
  for (let i = 0; i < bright * limit; i++) {
    const x = r() * w;
    const y = r() * h * maxY * 0.85;
    const s = 6 + r() * 14;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="url(#glow)" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${(1.3 + r() * 1.2).toFixed(2)}" fill="${TINTS[Math.floor(r() * 3)]}"/>`;
  }
  return out;
}

/** Milky Way: a band of soft light with dark dust lanes, along a curve. */
function milkyWay(w, h, seed, { cx = 0.5, cy = 0.55, tilt = -28, length = 1.5, strength = 1 } = {}) {
  // Mostly a river of tiny stars, a faint warm glow, and thin dark rifts along its spine.
  const r = rng(seed);
  const g = () => (r() + r() + r() + r() - 2) / 2; // ~gaussian, [-1, 1]
  let glowS = "";
  let dust = "";
  let fine = "";
  const N = 36;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1) - 0.5;
    const core = Math.exp(-((t * 2.4) ** 2));
    const x = cx * w + t * w * length;
    const y = cy * h + Math.sin(t * 2.2) * h * 0.06;
    const half = h * (0.035 + 0.075 * core); // half-width across the band
    glowS += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w * 0.06)}" ry="${f(half * 1.3)}" fill="${core > 0.6 && r() < 0.5 ? "#f2dcc4" : "#dfe6ee"}" opacity="${((0.018 + 0.05 * core) * strength).toFixed(3)}"/>`;
    const n = Math.round((90 + 520 * core) * strength);
    for (let k = 0; k < n; k++) {
      const px = x + (r() - 0.5) * w * (length / N) * 1.4;
      const py = y + g() * half * 1.6;
      fine += `<circle cx="${f(px)}" cy="${f(py)}" r="${(0.28 + Math.pow(r(), 3) * 0.9).toFixed(2)}" fill="${r() < 0.15 ? "#ffe6c9" : "#f4f1ea"}" opacity="${(0.15 + r() * 0.55).toFixed(2)}"/>`;
    }
    if (core > 0.25 && r() < 0.8) {
      const len = w * (0.02 + r() * 0.05);
      const thick = half * (0.08 + r() * 0.18);
      dust += `<ellipse cx="${f(x + (r() - 0.5) * w * 0.03)}" cy="${f(y + g() * half * 0.35)}" rx="${f(len)}" ry="${f(thick)}" transform="rotate(${f((r() - 0.5) * 14)} ${f(x)} ${f(y)})" fill="#03070a" opacity="${(0.28 + r() * 0.3).toFixed(2)}"/>`;
    }
  }
  const tr = `rotate(${tilt} ${f(cx * w)} ${f(cy * h)})`;
  return `<g transform="${tr}"><g filter="url(#blur60)">${glowS}</g>${fine}<g filter="url(#blur8)">${dust}</g></g>`;
}

/** Ridgeline silhouette (Himalayan profile). */
function ridge(w, h, seed, base, amp, color, { rough = 14, peaks = 4, snow = null } = {}) {
  const r = rng(seed);
  const P = Array.from({ length: peaks }, () => ({ x: r() * w, a: amp * (0.45 + r() * 0.8), s: w * (0.05 + r() * 0.12) }));
  const pts = [];
  const n = 140;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * w;
    let lift = 0;
    for (const p of P) lift += p.a * Math.exp(-(((x - p.x) / p.s) ** 2));
    pts.push([x, base - lift + (r() - 0.5) * rough]);
  }
  const d = `M0 ${h} L${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")} L${w} ${h}Z`;
  let s = `<path d="${d}" fill="${color}"/>`;
  if (snow) s += `<path d="${d}" fill="url(#${snow})"/>`;
  return s;
}

/* ---------- scenes ---------- */

// 1. Milky Way over the Himalaya, with a small lit tent. Wide.
function sceneRidgeMilkyWay() {
  const w = 2400, h = 1350;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(
    sky(w, h, [[0, "#03080a"], [0.45, "#08161a"], [0.78, "#14302c"], [1, "#2a4a3e"]]) +
      `<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4ab" stop-opacity=".45"/><stop offset=".18" stop-color="#9fb4ab" stop-opacity="0"/></linearGradient>
       <radialGradient id="tent"><stop offset="0" stop-color="#ffb267" stop-opacity=".95"/><stop offset=".4" stop-color="#ff8a3d" stop-opacity=".35"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>`,
  )}
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${stars(w, h, 11, { density: 3000, maxY: 0.85 })}
  ${milkyWay(w, h, 5, { cx: 0.55, cy: 0.42, tilt: -32, strength: 1 })}
  <rect y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="#3d5e4c" opacity=".18" filter="url(#blur60)"/>
  ${ridge(w, h, 3, 1030, 330, "#0f1f1d", { snow: "snow", peaks: 5 })}
  ${ridge(w, h, 9, 1120, 220, "#0a1514", { peaks: 4 })}
  ${ridge(w, h, 21, 1230, 120, "#060d0d", { peaks: 5, rough: 10 })}
  <circle cx="1690" cy="1206" r="90" fill="url(#tent)"/>
  <path d="M1662 1222 L1690 1188 L1718 1222 Z" fill="#ffcf96"/>
  <path d="M1690 1188 L1690 1222" stroke="#c86a2c" stroke-width="2"/>
  ${ridge(w, h, 33, 1300, 50, "#030707", { peaks: 6, rough: 6 })}
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

// 2. A city terrace at night: water tanks, parapet, antenna, orange skyglow, a few bright stars. Portrait.
function sceneRooftop() {
  const w = 1200, h = 1600;
  const r = rng(77);
  let skyline = "";
  let x = 0;
  while (x < w) {
    const bw = 60 + r() * 140;
    const bh = 120 + r() * 380;
    skyline += `<rect x="${f(x)}" y="${f(1180 - bh)}" width="${f(bw)}" height="${f(bh + 420)}" fill="#1a1416"/>`;
    for (let k = 0; k < 6; k++) if (r() < 0.5) skyline += `<rect x="${f(x + 8 + r() * (bw - 20))}" y="${f(1180 - bh + 16 + r() * (bh - 30))}" width="5" height="7" fill="#ffc77a" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`;
    x += bw + 6;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(
    sky(w, h, [[0, "#0b1013"], [0.4, "#1a1d24"], [0.72, "#4a3836"], [1, "#a8673d"]]),
  )}
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${stars(w, h, 31, { density: 600, limit: 0.35, maxY: 0.55, bright: 6 })}
  <circle cx="820" cy="300" r="34" fill="url(#glow)" opacity=".7"/><circle cx="820" cy="300" r="5" fill="#ffe9be"/>
  <circle cx="260" cy="210" r="22" fill="url(#glow)" opacity=".55"/><circle cx="260" cy="210" r="3" fill="#f7f4ec"/>
  <rect y="900" width="${w}" height="700" fill="#c97a45" opacity=".25" filter="url(#blur60)"/>
  ${skyline}
  <rect x="0" y="1260" width="${w}" height="340" fill="#0c0a0b"/>
  <rect x="0" y="1238" width="${w}" height="34" fill="#141011"/>
  <g fill="#0f0c0d">
    <rect x="130" y="1080" width="190" height="170" rx="16"/><rect x="118" y="1066" width="214" height="22" rx="8"/>
    <rect x="370" y="1120" width="150" height="130" rx="14"/><rect x="360" y="1108" width="170" height="18" rx="6"/>
    <rect x="910" y="980" width="8" height="270"/><path d="M860 1000 L968 1000 M880 1030 L948 1030 M896 1060 L932 1060" stroke="#0f0c0d" stroke-width="6"/>
  </g>
  <path d="M600 1238 C 700 1200 800 1205 980 1240" stroke="#2a1f1c" stroke-width="2" fill="none"/>
  ${Array.from({ length: 9 }, (_, i) => `<circle cx="${f(612 + i * 42)}" cy="${f(1232 - Math.sin((i / 8) * Math.PI) * 28)}" r="4" fill="#ffcf8a" opacity=".85"/>`).join("")}
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

// 3/4. A still lake with a crescent moon, at dusk and at night. Wide.
function sceneLake(night) {
  const w = 2400, h = 1350;
  const horizon = 820;
  const skyStops = night
    ? [[0, "#03080a"], [0.5, "#0a1a1e"], [0.6, "#173229"], [0.608, "#060d0d"], [1, "#030707"]]
    : [[0, "#1d2c3a"], [0.38, "#5b5a6a"], [0.6, "#e0a27a"], [0.608, "#1b1a1f"], [1, "#0c0c10"]];
  const moonX = 1640, moonY = 340; // same spot in both renders so the dusk-to-night cross-fade shows one moon
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(
    sky(w, h, skyStops) +
      `<linearGradient id="refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? "#173229" : "#e0a27a"}" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
       <mask id="crescent"><circle cx="${moonX}" cy="${moonY}" r="44" fill="#fff"/><circle cx="${moonX + 20}" cy="${moonY - 8}" r="42" fill="#000"/></mask>`,
  )}
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${night ? stars(w, horizon, 52, { density: 3200, maxY: 0.95 }) : stars(w, horizon, 52, { density: 300, limit: 0.25, maxY: 0.5, bright: 4 })}
  ${night ? milkyWay(w, horizon * 1.6, 9, { cx: 0.32, cy: 0.3, tilt: 62, strength: 0.75 }) : ""}
  <circle cx="${moonX}" cy="${moonY}" r="120" fill="url(#glow)" opacity="${night ? 0.35 : 0.5}"/>
  <circle cx="${moonX}" cy="${moonY}" r="44" fill="#f6eedd" mask="url(#crescent)"/>
  ${ridge(w, h, 41, horizon, 160, night ? "#0b1716" : "#2a2530", { peaks: 5 })}
  <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="${night ? "#04090a" : "#141217"}"/>
  <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#refl)"/>
  <g opacity=".5" filter="url(#blur2)">
    ${Array.from({ length: 26 }, (_, i) => `<rect x="${f(moonX - 40 - (i % 5) * 8)}" y="${f(horizon + 30 + i * 18)}" width="${f(70 + (i % 7) * 12)}" height="3" fill="#f6eedd" opacity="${(0.6 - i * 0.02).toFixed(2)}"/>`).join("")}
  </g>
  ${ridge(w, h, 63, 1350, 60, "#020404", { peaks: 3, rough: 8 })}
  <path d="M0 1290 C 300 1250 520 1300 760 1275 S 1100 1240 1300 1290 L1300 ${h} L0 ${h} Z" fill="#020404"/>
  ${Array.from({ length: 70 }, (_, i) => {
    const r = rng(900 + i);
    const gx = i * 18 + r() * 10;
    const gh = 30 + r() * 70;
    return `<path d="M${f(gx)} ${h} Q ${f(gx + 6 - r() * 12)} ${f(h - gh * 0.6)} ${f(gx + (r() - 0.5) * 24)} ${f(h - gh)}" stroke="#020404" stroke-width="3" fill="none"/>`;
  }).join("")}
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

// 5. First light over the ridges. Wide.
function sceneDawn() {
  const w = 2400, h = 1350;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(
    sky(w, h, [[0, "#0e1820"], [0.35, "#2f3a4a"], [0.6, "#a98591"], [0.78, "#e9b8a6"], [1, "#f3d6c4"]]) +
      `<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d9cf" stop-opacity=".5"/><stop offset=".2" stop-color="#f6d9cf" stop-opacity="0"/></linearGradient>`,
  )}
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${stars(w, h, 88, { density: 260, limit: 0.3, maxY: 0.35, bright: 3 })}
  <circle cx="620" cy="250" r="26" fill="url(#glow)" opacity=".8"/><circle cx="620" cy="250" r="4" fill="#fff6e0"/>
  ${ridge(w, h, 3, 980, 300, "#7d6672", { snow: "snow", peaks: 5 })}
  ${ridge(w, h, 9, 1080, 220, "#4a3c48", { peaks: 4 })}
  ${ridge(w, h, 21, 1180, 120, "#251d25", { peaks: 5 })}
  ${ridge(w, h, 33, 1290, 50, "#120e13", { peaks: 6, rough: 6 })}
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

// 6. A tent under the stars. Portrait.
function sceneTent() {
  const w = 1200, h = 1600;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(
    sky(w, h, [[0, "#03080a"], [0.55, "#0a1a1e"], [0.8, "#1c3a32"], [1, "#2b4a3e"]]) +
      `<radialGradient id="tent"><stop offset="0" stop-color="#ffb267" stop-opacity=".9"/><stop offset=".45" stop-color="#ff8a3d" stop-opacity=".3"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>`,
  )}
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${stars(w, h, 19, { density: 3400, maxY: 0.85 })}
  ${milkyWay(w, h, 13, { cx: 0.5, cy: 0.38, tilt: 74, length: 1.3, strength: 0.9 })}
  ${ridge(w, h, 5, 1220, 180, "#0b1716", { peaks: 3 })}
  <circle cx="600" cy="1330" r="260" fill="url(#tent)"/>
  <path d="M470 1400 L600 1250 L730 1400 Z" fill="#ffcf96"/>
  <path d="M600 1250 L600 1400 M600 1400 L560 1400" stroke="#b9602a" stroke-width="3"/>
  ${ridge(w, h, 15, 1430, 40, "#030707", { peaks: 4, rough: 6 })}
  <rect y="1430" width="${w}" height="${h - 1430}" fill="#030707"/>
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

const SCENES = [
  ["ridge-milkyway", sceneRidgeMilkyWay, 2400],
  ["rooftop-city", sceneRooftop, 1200],
  ["lake-dusk", () => sceneLake(false), 2400],
  ["lake-night", () => sceneLake(true), 2400],
  ["dawn-ridge", sceneDawn, 2400],
  ["tent-stars", sceneTent, 1200],
];

await fs.mkdir(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [name, fn, width] of SCENES.filter(([n]) => !only.length || only.includes(n))) {
  const svg = fn();
  const file = path.join(OUT, `${name}.webp`);
  await sharp(Buffer.from(svg), { density: 72 }).resize({ width }).webp({ quality: 82, effort: 5 }).toFile(file);
  const { size } = await fs.stat(file);
  console.log(`${name}.webp  ${(size / 1024).toFixed(0)} KB`);
}
