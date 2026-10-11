import * as A from "astronomy-engine";
import { STARS, type Star } from "./stars";

/* ---------- small maths ---------- */
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
export const norm360 = (x: number) => ((x % 360) + 360) % 360;

export type Loc = { name: string; lat: number; lon: number; tz: string; elev?: number; own?: boolean };
export const HANLE: Loc = { name: "Hanle, Ladakh", lat: 32.78, lon: 78.96, tz: "Asia/Kolkata", elev: 4500 };

export type AltAz = { alt: number; az: number };

/** Local sidereal time in degrees. */
export function lst(date: Date, lon: number) {
  return norm360(A.SiderealTime(date) * 15 + lon);
}

/** Equatorial (deg) to horizontal (deg) for a given local sidereal time. Fast path for star fields. */
export function eqToHor(ra: number, dec: number, lat: number, lstDeg: number): AltAz {
  const H = (lstDeg - ra) * D2R;
  const d = dec * D2R;
  const p = lat * D2R;
  const sinAlt = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H));
  return { alt: alt * R2D, az: norm360(az * R2D) };
}

/* ---------- bodies ---------- */
const observer = (l: Loc) => new A.Observer(l.lat, l.lon, l.elev ?? 0);

export function bodyAltAz(body: A.Body, date: Date, l: Loc): AltAz {
  const o = observer(l);
  const eq = A.Equator(body, date, o, true, true);
  const h = A.Horizon(date, o, eq.ra, eq.dec, "normal");
  return { alt: h.altitude, az: h.azimuth };
}

export const sunAltAz = (d: Date, l: Loc) => bodyAltAz(A.Body.Sun, d, l);
export const moonAltAz = (d: Date, l: Loc) => bodyAltAz(A.Body.Moon, d, l);

export function moonInfo(date: Date) {
  const ill = A.Illumination(A.Body.Moon, date);
  const phase = A.MoonPhase(date); // 0 new, 90 first quarter, 180 full, 270 last quarter
  const waxing = phase < 180;
  const f = ill.phase_fraction;
  let name = "New moon";
  if (f > 0.97) name = "Full moon";
  else if (f > 0.53) name = waxing ? "Waxing gibbous" : "Waning gibbous";
  else if (f > 0.47) name = waxing ? "First quarter" : "Last quarter";
  else if (f > 0.03) name = waxing ? "Waxing crescent" : "Waning crescent";
  return { fraction: f, phase, waxing, name };
}

export const PLANETS: { body: A.Body; name: string }[] = [
  { body: A.Body.Venus, name: "Venus" },
  { body: A.Body.Mars, name: "Mars" },
  { body: A.Body.Jupiter, name: "Jupiter" },
  { body: A.Body.Saturn, name: "Saturn" },
];

export function planetsAltAz(date: Date, l: Loc) {
  return PLANETS.map((p) => {
    const h = bodyAltAz(p.body, date, l);
    const mag = A.Illumination(p.body, date).mag;
    return { ...p, ...h, mag };
  });
}

/* ---------- stars ---------- */
export type PlacedStar = Star & AltAz;
export function placeStars(date: Date, l: Loc, stars: Star[] = STARS): PlacedStar[] {
  const t = lst(date, l.lon);
  const P = precessor(date);
  return stars.map((s) => {
    const p = P(s.ra, s.dec);
    return { ...s, ...eqToHor(p.ra, p.dec, l.lat, t) };
  });
}

/** The catalogue star closest to the zenith. */
export function overhead(date: Date, l: Loc) {
  const placed = placeStars(date, l).filter((s) => s.mag < 3);
  placed.sort((a, b) => b.alt - a.alt);
  return placed[0];
}

/** Next rise, highest point and set for a fixed star within ~24h. */
export function starDay(star: Star, from: Date, l: Loc) {
  const step = 4 * 60 * 1000;
  let rise: Date | null = null;
  let set: Date | null = null;
  let best = { alt: -90, at: from };
  let prev = eqToHor(star.ra, star.dec, l.lat, lst(from, l.lon)).alt;
  for (let i = 1; i <= 360; i++) {
    const t = new Date(from.getTime() + i * step);
    const alt = eqToHor(star.ra, star.dec, l.lat, lst(t, l.lon)).alt;
    if (!rise && prev < 0 && alt >= 0) rise = t;
    if (!set && prev >= 0 && alt < 0) set = t;
    if (alt > best.alt) best = { alt, at: t };
    prev = alt;
  }
  const maxAlt = 90 - Math.abs(l.lat - star.dec);
  const circumpolar = l.lat >= 0 ? star.dec > 90 - l.lat : star.dec < -90 - l.lat;
  const neverRises = maxAlt < 0;
  return { rise, set, transit: best.at, transitAlt: best.alt, circumpolar, neverRises };
}

/* ---------- tonight ---------- */
const DAY = 86400000;
const safe = (t: A.AstroTime | null) => (t ? t.date : null);

export type Night = {
  sunset: Date;
  sunrise: Date;
  darkStart: Date | null;
  darkEnd: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  best: { start: Date; end: Date } | null;
  samples: { t: Date; sun: number; moon: number }[];
};

export function tonight(now: Date, l: Loc): Night {
  const o = observer(l);
  const sunUp = sunAltAz(now, l).alt > -0.833;
  const from = sunUp ? now : new Date(now.getTime() - DAY);
  const sunset = safe(A.SearchRiseSet(A.Body.Sun, o, -1, from, 2)) ?? new Date(now.getTime());
  const sunrise = safe(A.SearchRiseSet(A.Body.Sun, o, +1, sunset, 2)) ?? new Date(sunset.getTime() + 11 * 3600000);
  const darkStart = safe(A.SearchAltitude(A.Body.Sun, o, -1, sunset, 1, -18));
  const darkEnd = darkStart ? safe(A.SearchAltitude(A.Body.Sun, o, +1, darkStart, 1, -18)) : null;
  const moonrise = safe(A.SearchRiseSet(A.Body.Moon, o, +1, sunset, 1));
  const moonset = safe(A.SearchRiseSet(A.Body.Moon, o, -1, sunset, 1));

  const samples: Night["samples"] = [];
  const span = sunrise.getTime() - sunset.getTime();
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = new Date(sunset.getTime() + (span * i) / n);
    samples.push({ t, sun: sunAltAz(t, l).alt, moon: moonAltAz(t, l).alt });
  }
  const moonBright = moonInfo(new Date(sunset.getTime() + span / 2)).fraction > 0.25;
  let best: Night["best"] = null;
  let runStart: Date | null = null;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const dark = s.sun < -18 && (!moonBright || s.moon < 0);
    if (dark && !runStart) runStart = s.t;
    if ((!dark || i === samples.length - 1) && runStart) {
      const end = s.t;
      if (!best || end.getTime() - runStart.getTime() > best.end.getTime() - best.start.getTime()) best = { start: runStart, end };
      runStart = null;
    }
  }
  return { sunset, sunrise, darkStart, darkEnd, moonrise, moonset, best, samples };
}

/* ---------- events ---------- */
export type SkyEvent = { date: Date; title: string; detail: string; kind: "moon" | "eclipse" | "meteor" | "season" };

const SHOWERS = [
  { name: "Quadrantids", m: 0, d: 3, rate: "up to ~80 an hour" },
  { name: "Lyrids", m: 3, d: 22, rate: "around 18 an hour" },
  { name: "Eta Aquariids", m: 4, d: 6, rate: "best before dawn" },
  { name: "Perseids", m: 7, d: 12, rate: "up to ~100 an hour" },
  { name: "Orionids", m: 9, d: 21, rate: "around 20 an hour" },
  { name: "Leonids", m: 10, d: 17, rate: "around 15 an hour" },
  { name: "Geminids", m: 11, d: 14, rate: "up to ~120 an hour" },
];

export function upcomingEvents(now: Date, l: Loc, count = 6): SkyEvent[] {
  const out: SkyEvent[] = [];
  // Moon phases
  let q = A.SearchMoonQuarter(now);
  for (let i = 0; i < 8; i++) {
    if (q.quarter === 0 || q.quarter === 2) {
      out.push({
        date: q.time.date,
        title: q.quarter === 2 ? "Full moon" : "New moon",
        detail: q.quarter === 2 ? "Bright sky all night. Good for the Moon, hard for faint stars." : "The darkest nights of the month start here.",
        kind: "moon",
      });
    }
    q = A.NextMoonQuarter(q);
  }
  // Lunar eclipse
  const le = A.SearchLunarEclipse(now);
  const leAlt = moonAltAz(le.peak.date, l).alt;
  out.push({
    date: le.peak.date,
    title: `${cap(le.kind)} lunar eclipse`,
    detail: leAlt > 0 ? `The Moon will be ${Math.round(leAlt)}° up from ${l.name} at peak.` : `The Moon is below your horizon at peak. Luna will show where to go.`,
    kind: "eclipse",
  });
  // Solar eclipse
  const se = A.SearchGlobalSolarEclipse(now);
  out.push({
    date: se.peak.date,
    title: `${cap(se.kind)} solar eclipse`,
    detail: se.latitude !== undefined ? `Best seen near ${fmtLat(se.latitude)}, ${fmtLon(se.longitude!)}.` : "Visible from parts of Earth.",
    kind: "eclipse",
  });
  // Meteor showers (next peak of each)
  for (const s of SHOWERS) {
    let d = new Date(Date.UTC(now.getUTCFullYear(), s.m, s.d, 12));
    if (d.getTime() < now.getTime() - DAY) d = new Date(Date.UTC(now.getUTCFullYear() + 1, s.m, s.d, 12));
    const moon = Math.round(moonInfo(d).fraction * 100);
    out.push({ date: d, title: `${s.name} peak`, detail: `${cap(s.rate)}. Moon ${moon}% lit that night.`, kind: "meteor" });
  }
  // Seasons
  for (const y of [now.getUTCFullYear(), now.getUTCFullYear() + 1]) {
    const s = A.Seasons(y);
    out.push({ date: s.mar_equinox.date, title: "March equinox", detail: "Day and night are nearly equal.", kind: "season" });
    out.push({ date: s.jun_solstice.date, title: "June solstice", detail: l.lat >= 0 ? "Your shortest night of the year." : "Your longest night of the year.", kind: "season" });
    out.push({ date: s.sep_equinox.date, title: "September equinox", detail: "Day and night are nearly equal.", kind: "season" });
    out.push({ date: s.dec_solstice.date, title: "December solstice", detail: l.lat >= 0 ? "Your longest night of the year." : "Your shortest night of the year.", kind: "season" });
  }
  return out
    .filter((e) => e.date.getTime() > now.getTime() - 6 * 3600000)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

/* ---------- geography ---------- */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const p1 = a.lat * D2R, p2 = b.lat * D2R;
  const dp = (b.lat - a.lat) * D2R, dl = (b.lon - a.lon) * D2R;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
export function bearing(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const p1 = a.lat * D2R, p2 = b.lat * D2R, dl = (b.lon - a.lon) * D2R;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return norm360(Math.atan2(y, x) * R2D);
}

/* ---------- Milky Way (galactic plane → equatorial) ---------- */
export function galToEq(l: number, b: number) {
  const aG = 192.85948 * D2R, dG = 27.12825 * D2R, lN = 122.93192 * D2R;
  const L = l * D2R, B = b * D2R;
  const sinD = Math.sin(dG) * Math.sin(B) + Math.cos(dG) * Math.cos(B) * Math.cos(lN - L);
  const dec = Math.asin(sinD);
  const ra = aG + Math.atan2(Math.cos(B) * Math.sin(lN - L), Math.cos(dG) * Math.sin(B) - Math.sin(dG) * Math.cos(B) * Math.cos(lN - L));
  return { ra: norm360(ra * R2D), dec: dec * R2D };
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Faint texture stars (not catalogue stars) fixed on the celestial sphere, plus Milky Way haze points. */
export const DUST = (() => {
  const r = rng(42);
  return Array.from({ length: 1100 }, () => {
    const ra = r() * 360;
    const dec = Math.asin(2 * r() - 1) * R2D;
    return { ra, dec, mag: 3.6 + r() * 2.6 };
  });
})();

export const MILKY = (() => {
  const r = rng(7);
  const g = () => (r() + r() + r() - 1.5) / 1.5; // ~gaussian in [-1,1]
  return Array.from({ length: 900 }, () => {
    const l = r() * 360;
    const core = Math.cos(((l > 180 ? l - 360 : l) * D2R) / 2) ** 2; // brighter towards Sagittarius
    const b = g() * (6 + 6 * core);
    const { ra, dec } = galToEq(l, b);
    return { ra, dec, w: 0.25 + core * 0.75, s: 10 + r() * 22 };
  });
})();

/* ---------- formatting ---------- */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const fmtLat = (x: number) => `${Math.abs(x).toFixed(1)}°${x >= 0 ? "N" : "S"}`;
export const fmtLon = (x: number) => `${Math.abs(x).toFixed(1)}°${x >= 0 ? "E" : "W"}`;
export const fmtDeg = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(1)}°`;

export function fmtTime(d: Date | null | undefined, tz: string) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(d);
}
export function fmtDate(d: Date, tz: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(d);
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export const compass = (az: number) => COMPASS[Math.round(norm360(az) / 22.5) % 16];

export function twilightName(sunAlt: number) {
  if (sunAlt > -0.833) return "Daylight";
  if (sunAlt > -6) return "Civil twilight";
  if (sunAlt > -12) return "Nautical twilight";
  if (sunAlt > -18) return "Astronomical twilight";
  return "True dark";
}

/* ---------- time zones ---------- */
/** Minutes the zone is ahead of UTC at that instant. */
export function tzOffset(date: Date, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}
/** A wall-clock time in a zone, as a Date. */
export function zoned(y: number, m: number, d: number, h: number, min: number, tz: string) {
  const guess = Date.UTC(y, m, d, h, min);
  return new Date(guess - tzOffset(new Date(guess), tz) * 60000);
}
/** yyyy-mm-dd of an instant, in a zone. */
export function ymd(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function nextNewMoon(from: Date) {
  let q = A.SearchMoonQuarter(from);
  while (q.quarter !== 0) q = A.NextMoonQuarter(q);
  return q.time.date;
}

/* ---------- precession ---------- */
/**
 * J2000 catalogue → equator of date (precession + nutation). Tiny today (~0.4°),
 * but essential for "any year": a thousand years moves the pole star noticeably.
 */
export function precessor(date: Date) {
  const m = A.Rotation_EQJ_EQD(date).rot;
  return (ra: number, dec: number) => {
    const r = ra * D2R, d = dec * D2R;
    const x = Math.cos(d) * Math.cos(r), y = Math.cos(d) * Math.sin(r), z = Math.sin(d);
    const X = m[0][0] * x + m[1][0] * y + m[2][0] * z;
    const Y = m[0][1] * x + m[1][1] * y + m[2][1] * z;
    const Z = m[0][2] * x + m[1][2] * y + m[2][2] * z;
    return { ra: norm360(Math.atan2(Y, X) * R2D), dec: Math.asin(Math.max(-1, Math.min(1, Z))) * R2D };
  };
}
/** eqToHor for a J2000 position at a given instant. */
export function j2000ToHor(ra: number, dec: number, date: Date, l: { lat: number; lon: number }, P = precessor(date)) {
  const p = P(ra, dec);
  return eqToHor(p.ra, p.dec, l.lat, lst(date, l.lon));
}
