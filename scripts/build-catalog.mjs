// Build Luna's offline sky catalogue from d3-celestial's data (BSD-3-Clause, © Olaf Frohn;
// stars from the Hipparcos catalogue). Output: public/data/sky-catalog.json
//   node scripts/build-catalog.mjs
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("node_modules/d3-celestial/data");
const read = async (f) => JSON.parse(await fs.readFile(path.join(SRC, f), "utf8"));
const ra360 = (x) => ((x % 360) + 360) % 360;
const r = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

const stars6 = await read("stars.6.json");
const names = await read("starnames.json");
const lines = await read("constellations.lines.json");
const cons = await read("constellations.json");
const dsos = await read("dsos.bright.json");
let dsoNames = {};
try {
  dsoNames = await read("dsonames.json");
} catch {}

// colour class from B-V: 0 blue, 1 white, 2 yellow, 3 orange, 4 red
const tint = (bv) => {
  const b = parseFloat(bv);
  if (Number.isNaN(b)) return 1;
  if (b < 0) return 0;
  if (b < 0.4) return 1;
  if (b < 0.8) return 2;
  if (b < 1.3) return 3;
  return 4;
};

const stars = [];
const starNames = {};
for (const f of stars6.features) {
  const [lon, lat] = f.geometry.coordinates;
  const mag = f.properties.mag;
  if (mag > 6.2) continue;
  const hip = Number(f.id);
  stars.push([r(ra360(lon)), r(lat), r(mag, 2), tint(f.properties.bv), hip]);
  const n = names[String(hip)];
  if (n) {
    const label = n.name || (n.bayer && mag < 3.2 ? `${n.bayer} ${n.c}` : "");
    if (label) starNames[hip] = { n: label, c: n.c };
  }
}
stars.sort((a, b) => a[2] - b[2]);

const conLines = {};
for (const f of lines.features) {
  conLines[f.id] = f.geometry.coordinates.map((seg) => seg.map(([lon, lat]) => [r(ra360(lon), 2), r(lat, 2)]));
}

const conList = cons.features.map((f) => ({
  id: f.id,
  name: f.properties.name,
  rank: Number(f.properties.rank),
  ra: r(ra360(f.geometry.coordinates[0]), 2),
  dec: r(f.geometry.coordinates[1], 2),
}));

const TYPE = { oc: "Open cluster", gc: "Globular cluster", en: "Nebula", bn: "Nebula", sn: "Supernova remnant", pn: "Planetary nebula", g: "Galaxy", s: "Galaxy", s0: "Galaxy", sd: "Galaxy", i: "Galaxy", e: "Galaxy", rn: "Nebula", dn: "Dark nebula", snr: "Supernova remnant", sfr: "Nebula", pos: "Galactic centre" };
const dsoList = dsos.features
  .filter((f) => f.properties.mag !== undefined && f.properties.mag <= 7)
  .map((f) => {
    const id = f.id;
    const nm = dsoNames[id];
    const name = id === "GC" ? "Galactic Centre" : (nm && (nm.en || nm.name)) || f.properties.name || id.replace(/^Cr /, "Collinder ");
    return { id, name, type: TYPE[f.properties.type] ?? "Deep-sky object", mag: f.properties.mag, ra: r(ra360(f.geometry.coordinates[0]), 2), dec: r(f.geometry.coordinates[1], 2) };
  });

const out = {
  source: "d3-celestial data (BSD-3-Clause, Olaf Frohn); stars from Hipparcos",
  stars,
  names: starNames,
  lines: conLines,
  cons: conList,
  dsos: dsoList,
};
await fs.mkdir("public/data", { recursive: true });
await fs.writeFile("public/data/sky-catalog.json", JSON.stringify(out));
const { size } = await fs.stat("public/data/sky-catalog.json");
console.log(`stars ${stars.length}, named ${Object.keys(starNames).length}, constellations ${conList.length}, dsos ${dsoList.length} → ${(size / 1024).toFixed(0)} KB`);
