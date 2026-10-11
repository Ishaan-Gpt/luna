import type { Catalog } from "./catalog";
import type { SkyObj, SkyState } from "./lens";
import { bodyAltAz, compass, eqToHor, fmtTime, lst, moonInfo, precessor, twilightName, type Loc, type Night } from "./sky";
import * as A from "astronomy-engine";

/*
 * Grounding: the model never states where something is from memory.
 *  1. resolve what the question is about (a name, a nickname, or whatever the phone points at)
 *  2. compute the facts with the sky engine
 *  3. the model phrases an answer from those facts
 *  4. verify every object, direction, height and time in the answer; replace it if anything is off
 */

const D2R = Math.PI / 180;
const WORDS: Record<string, string> = { N: "north", NNE: "north-northeast", NE: "northeast", ENE: "east-northeast", E: "east", ESE: "east-southeast", SE: "southeast", SSE: "south-southeast", S: "south", SSW: "south-southwest", SW: "southwest", WSW: "west-southwest", W: "west", WNW: "west-northwest", NW: "northwest", NNW: "north-northwest" };
const DIR_AZ: Record<string, number> = { north: 0, "north-northeast": 22.5, northeast: 45, "east-northeast": 67.5, east: 90, "east-southeast": 112.5, southeast: 135, "south-southeast": 157.5, south: 180, "south-southwest": 202.5, southwest: 225, "west-southwest": 247.5, west: 270, "west-northwest": 292.5, northwest: 315, "north-northwest": 337.5 };
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

export const dirWord = (az: number) => WORDS[compass(az)];
export const fistsText = (alt: number) => {
  const f = Math.max(0, Math.round(alt / 10));
  if (alt > 80) return "almost straight up";
  if (f === 0) return "just above the horizon";
  return `${NUM[f] ?? f} fist${f === 1 ? "" : "s"} above the horizon`;
};

export function angDist(a: { alt: number; az: number }, b: { alt: number; az: number }) {
  const s = Math.sin(a.alt * D2R) * Math.sin(b.alt * D2R) + Math.cos(a.alt * D2R) * Math.cos(b.alt * D2R) * Math.cos((a.az - b.az) * D2R);
  return Math.acos(Math.max(-1, Math.min(1, s))) / D2R;
}

/** Rise, highest point and set over the next ~24 h by sampling altitude. */
export function riseSet(altAt: (d: Date) => number, from: Date) {
  const step = 5 * 60000;
  let rise: Date | null = null, set: Date | null = null, top = { alt: -90, at: from };
  let prev = altAt(from);
  for (let i = 1; i <= 288; i++) {
    const t = new Date(from.getTime() + i * step);
    const a = altAt(t);
    if (!rise && prev < 0 && a >= 0) rise = t;
    if (!set && prev >= 0 && a < 0) set = t;
    if (a > top.alt) top = { alt: a, at: t };
    prev = a;
  }
  return { rise, set, top };
}

export function altFn(obj: SkyObj, loc: Loc): ((d: Date) => number) | null {
  if (obj.kind === "moon") return (d) => bodyAltAz(A.Body.Moon, d, loc).alt;
  if (obj.kind === "sun") return (d) => bodyAltAz(A.Body.Sun, d, loc).alt;
  if (obj.kind === "planet") {
    const body = (A.Body as Record<string, A.Body>)[obj.name];
    return body ? (d) => bodyAltAz(body, d, loc).alt : null;
  }
  if (obj.ra === undefined || obj.dec === undefined) return null;
  const P = precessor(new Date());
  const p = P(obj.ra, obj.dec);
  return (d) => eqToHor(p.ra, p.dec, loc.lat, lst(d, loc.lon)).alt;
}

/* ---------- resolving the subject ---------- */
export type Subject = { obj: SkyObj; how: "named" | "nickname" | "pointing" | "brightest" };

const DEICTIC = /\b(this|that|there|over there|bright one|brightest|what am i (looking|pointing)|what's up there|which star is)\b/i;

export function resolveSubject(q: string, sky: SkyState, cat: Catalog | null, pointing: { az: number; alt: number } | null, nicknames: Record<string, string>): Subject | null {
  const text = q.toLowerCase();
  // nicknames first: they are personal and specific
  for (const [id, nick] of Object.entries(nicknames)) {
    if (nick && text.includes(nick.toLowerCase())) {
      const obj = sky.objs.find((o) => o.id === id);
      if (obj) return { obj, how: "nickname" };
    }
  }
  // named objects, longest names first so "Andromeda Galaxy" beats "Andromeda"
  const named = sky.objs.filter((o) => !o.name.startsWith("HIP") && o.name.length > 2).sort((a, b) => b.name.length - a.name.length);
  for (const o of named) {
    const n = o.name.toLowerCase().replace(/^the /, "");
    if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) return { obj: o, how: "named" };
  }
  if (cat) {
    for (const c of cat.cons) {
      if (new RegExp(`\\b${c.name.toLowerCase()}\\b`).test(text)) {
        const stars = sky.objs.filter((o) => o.kind === "star" && o.con === c.id).sort((a, b) => a.mag - b.mag);
        if (stars[0]) return { obj: { ...stars[0], name: `${c.name} (brightest star: ${stars[0].name})` }, how: "named" };
      }
    }
  }
  if (DEICTIC.test(text)) {
    const up = sky.objs.filter((o) => o.alt > 0 && o.kind !== "sun");
    if (pointing) {
      const near = up
        .map((o) => ({ o, d: angDist(o, pointing) }))
        .filter((x) => x.d < 14)
        .sort((a, b) => a.o.mag - b.o.mag + (a.d - b.d) * 0.08);
      if (near[0]) return { obj: near[0].o, how: "pointing" };
    }
    const brightest = up.sort((a, b) => a.mag - b.mag)[0];
    if (brightest) return { obj: brightest, how: "brightest" };
  }
  return null;
}

/* ---------- facts ---------- */
export type Facts = {
  lines: string[];
  subject: Subject | null;
  allowed: Map<string, SkyObj>;
  times: Date[];
  deterministic: string;
};

function describe(o: SkyObj) {
  const what = o.kind === "planet" ? "planet" : o.kind === "moon" ? "the Moon" : o.kind === "sun" ? "the Sun" : o.kind === "dso" ? (o.type ?? "deep-sky object").toLowerCase() : o.con ? `star in ${o.con}` : "star";
  return `${o.name} (${what}, magnitude ${o.mag.toFixed(1)})`;
}

export function buildFacts(q: string, sky: SkyState, cat: Catalog | null, loc: Loc, night: Night | null, pointing: { az: number; alt: number } | null, nicknames: Record<string, string>, limit: number): Facts {
  const lines: string[] = [];
  const allowed = new Map<string, SkyObj>();
  const times: Date[] = [];
  const tz = loc.tz;
  lines.push(`Now: ${fmtTime(sky.date, tz)} at ${loc.name} (${loc.lat.toFixed(1)}°, ${loc.lon.toFixed(1)}°). The Sun is ${Math.abs(sky.sunAlt).toFixed(0)}° ${sky.sunAlt < 0 ? "below" : "above"} the horizon: ${twilightName(sky.sunAlt).toLowerCase()}.`);
  if (pointing) lines.push(`The phone is pointing ${dirWord(pointing.az)} (azimuth ${pointing.az.toFixed(0)}°), ${pointing.alt.toFixed(0)}° up.`);
  lines.push(`This sky shows stars down to about magnitude ${limit.toFixed(1)}.`);

  const subject = resolveSubject(q, sky, cat, pointing, nicknames);
  let deterministic = "";
  if (subject) {
    const o = subject.obj;
    allowed.set(o.id, o);
    const nick = nicknames[o.id];
    const label = nick ? `“${nick}” (${o.name})` : o.name;
    if (o.alt > 0) {
      lines.push(`${describe(o)}${nick ? `, nicknamed “${nick}”` : ""}: now ${o.alt.toFixed(0)}° up in the ${dirWord(o.az)} (azimuth ${o.az.toFixed(0)}°), ${fistsText(o.alt)}.`);
    } else {
      lines.push(`${describe(o)}: currently below the horizon.`);
    }
    const fn = altFn(o, loc);
    if (fn) {
      const rs = riseSet(fn, sky.date);
      const bits: string[] = [];
      if (rs.rise) { bits.push(`rises ${fmtTime(rs.rise, tz)}`); times.push(rs.rise); }
      if (rs.top.alt > 0) { bits.push(`highest at ${fmtTime(rs.top.at, tz)} (${rs.top.alt.toFixed(0)}° up)`); times.push(rs.top.at); }
      if (rs.set) { bits.push(`sets ${fmtTime(rs.set, tz)}`); times.push(rs.set); }
      if (!rs.rise && !rs.set) bits.push(rs.top.alt > 0 ? "stays above the horizon all day" : "does not rise from here");
      lines.push(`Over the next day ${o.name} ${bits.join(", ")}.`);
      deterministic =
        o.alt > 0
          ? `${subject.how === "pointing" ? "That's" : ""}${subject.how === "pointing" ? " " : ""}${label}${subject.how === "pointing" ? "" : " is"} ${fistsText(o.alt)} in the ${dirWord(o.az)}. ${rs.set ? `It sets at ${fmtTime(rs.set, tz)}.` : rs.top.alt > 0 ? `It is highest at ${fmtTime(rs.top.at, tz)}.` : ""}`.trim()
          : `${label} is below the horizon right now. ${rs.rise ? `It rises at ${fmtTime(rs.rise, tz)}${rs.top.alt > 0 ? ` and is highest at ${fmtTime(rs.top.at, tz)}` : ""}.` : "It doesn't rise from here."}`.trim();
      deterministic = deterministic.replace(/^That's /, "That's ");
    }
  }

  // the brightest things up now, for context
  const bright = sky.objs.filter((o) => o.alt > 8 && o.kind !== "sun" && o.mag <= Math.min(limit, 1.8)).sort((a, b) => a.mag - b.mag).slice(0, 6);
  if (bright.length) {
    lines.push(`Brightest things up now: ${bright.map((o) => `${o.name} (${o.kind === "star" ? "star" : o.kind}, ${o.alt.toFixed(0)}° up, ${dirWord(o.az)})`).join("; ")}.`);
    bright.forEach((o) => allowed.set(o.id, o));
  }
  const m = moonInfo(sky.date);
  const moon = sky.objs.find((o) => o.kind === "moon");
  if (moon) {
    allowed.set("moon", moon);
    lines.push(`The Moon is ${Math.round(m.fraction * 100)}% lit (${m.name.toLowerCase()}) and ${moon.alt > 0 ? `${moon.alt.toFixed(0)}° up in the ${dirWord(moon.az)}` : "below the horizon"}.`);
  }
  if (night) {
    if (night.darkStart && night.darkEnd) {
      lines.push(`Tonight is truly dark from ${fmtTime(night.darkStart, tz)} to ${fmtTime(night.darkEnd, tz)}. Sunset ${fmtTime(night.sunset, tz)}, sunrise ${fmtTime(night.sunrise, tz)}.`);
      times.push(night.darkStart, night.darkEnd, night.sunset, night.sunrise);
    }
    if (night.best) {
      lines.push(`The best moon-free dark window tonight is ${fmtTime(night.best.start, tz)} to ${fmtTime(night.best.end, tz)}.`);
      times.push(night.best.start, night.best.end);
    }
  }
  if (!deterministic) {
    if (/\b(best time|when.*dark|tonight|stargaz)/i.test(q) && night?.best) {
      deterministic = `The best window tonight is ${fmtTime(night.best.start, tz)} to ${fmtTime(night.best.end, tz)}, when the sky is dark and the Moon is out of the way.`;
    } else if (/\bmoon\b/i.test(q) && moon) {
      deterministic = `The Moon is ${Math.round(m.fraction * 100)}% lit and ${moon.alt > 0 ? `${fistsText(moon.alt)} in the ${dirWord(moon.az)}` : "below the horizon right now"}.`;
    } else if (bright.length) {
      deterministic = `Up now: ${bright.slice(0, 3).map((o) => `${o.name}, ${fistsText(o.alt)} in the ${dirWord(o.az)}`).join("; ")}.`;
    } else {
      deterministic = sky.sunAlt > -6 ? "It's still too bright for stars here. Try again after dusk." : "Nothing bright is up in that direction right now.";
    }
  }
  return { lines, subject, allowed, times, deterministic };
}

export const SYSTEM = [
  "You are Luna, a calm night-sky guide talking to someone standing outside at night.",
  "Answer in one or two short sentences they can follow with their eyes.",
  "Use ONLY the facts provided for which objects are up, their directions, heights and times. Never invent a star, a direction or a time.",
  "Give directions as compass words (like 'low in the southwest') and heights in fists held at arm's length (one fist is about 10 degrees).",
  "You may add one short, well-known fact about the object itself. If the facts don't answer the question, say so plainly.",
].join(" ");

export function userPrompt(q: string, f: Facts) {
  return `Facts from Luna's sky engine:\n- ${f.lines.join("\n- ")}\n\nQuestion: ${q}`;
}

/* ---------- verification ---------- */
export type Verdict = { status: "checked" | "corrected"; issues: string[]; final: string };

export function verify(answer: string, f: Facts, sky: SkyState, tz: string): Verdict {
  const issues: string[] = [];
  const text = answer.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();

  // 1. every named sky object must be one Luna computed facts for
  const mentioned = sky.objs.filter((o) => o.kind !== "star" || !o.name.startsWith("HIP")).filter((o) => o.name.length > 3 && new RegExp(`\\b${o.name.toLowerCase().replace(/^the /, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower));
  for (const o of mentioned) {
    if (!f.allowed.has(o.id) && o.kind !== "sun") {
      if (o.alt <= 0) issues.push(`mentions ${o.name}, which is below the horizon`);
      else if (!/\b(also|nearby|near|next to)\b/.test(lower)) issues.push(`mentions ${o.name}, which Luna didn't look up for this question`);
    }
  }
  // 2. directions must match the subject's real direction (within 45°)
  const subj = f.subject?.obj;
  if (subj && subj.alt > 0) {
    const dirs = Object.keys(DIR_AZ).filter((d) => new RegExp(`\\b${d}\\b`).test(lower)).filter((d, _, all) => !all.some((x) => x !== d && x.includes(d)));
    if (dirs.length && !dirs.some((d) => Math.abs((((DIR_AZ[d] - subj.az) % 360) + 540) % 360 - 180) <= 45)) {
      issues.push(`says ${dirs.join("/")}, but ${subj.name} is in the ${dirWord(subj.az)}`);
    }
    // 3. heights in fists or degrees
    const fm = lower.match(/\b(one|two|three|four|five|six|seven|eight|nine|\d)\s+fists?\b/);
    if (fm) {
      const n = NUM.indexOf(fm[1]) >= 0 ? NUM.indexOf(fm[1]) : Number(fm[1]);
      if (Math.abs(n * 10 - subj.alt) > 15) issues.push(`says ${fm[0]}, but it is ${subj.alt.toFixed(0)}° up`);
    }
    const dm = lower.match(/\b(\d{1,2})\s*(°|degrees)\s*(up|high|above)/);
    if (dm && Math.abs(Number(dm[1]) - subj.alt) > 12) issues.push(`says ${dm[1]}°, but it is ${subj.alt.toFixed(0)}° up`);
  }
  // 4. clock times must be ones Luna computed (±10 min)
  for (const tm of text.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g)) {
    const mins = Number(tm[1]) * 60 + Number(tm[2]);
    const ok = f.times.some((t) => {
      const [h, m] = fmtTime(t, tz).split(":").map(Number);
      const d = Math.abs(h * 60 + m - mins);
      return Math.min(d, 1440 - d) <= 10;
    });
    if (!ok) issues.push(`gives a time (${tm[0]}) Luna didn't compute`);
  }
  if (!text) issues.push("returned nothing");
  return issues.length ? { status: "corrected", issues, final: f.deterministic } : { status: "checked", issues, final: text };
}
