/*
 * Bright-star catalogue for the Luna demos.
 * Positions are J2000 right ascension / declination in degrees, magnitudes are visual (V).
 * Distances (light years) and ages are published estimates, rounded, and shown as "est." in the UI.
 */

export type Star = {
  id: string;
  name: string;
  con: string; // constellation
  ra: number;
  dec: number;
  mag: number;
  ly?: number;
  age?: string;
  tint?: "blue" | "white" | "yellow" | "orange" | "red";
};

export const STARS: Star[] = [
  { id: "sirius", name: "Sirius", con: "Canis Major", ra: 101.287, dec: -16.716, mag: -1.46, ly: 8.6, age: "~230 million years", tint: "white" },
  { id: "canopus", name: "Canopus", con: "Carina", ra: 95.988, dec: -52.696, mag: -0.74, ly: 310, age: "~25 million years", tint: "white" },
  { id: "arcturus", name: "Arcturus", con: "Boötes", ra: 213.915, dec: 19.182, mag: -0.05, ly: 37, age: "~7 billion years", tint: "orange" },
  { id: "vega", name: "Vega", con: "Lyra", ra: 279.234, dec: 38.784, mag: 0.03, ly: 25, age: "~455 million years", tint: "white" },
  { id: "capella", name: "Capella", con: "Auriga", ra: 79.172, dec: 45.998, mag: 0.08, ly: 43, age: "~590 million years", tint: "yellow" },
  { id: "rigel", name: "Rigel", con: "Orion", ra: 78.634, dec: -8.202, mag: 0.13, ly: 860, age: "~8 million years", tint: "blue" },
  { id: "procyon", name: "Procyon", con: "Canis Minor", ra: 114.825, dec: 5.225, mag: 0.34, ly: 11.5, age: "~1.9 billion years", tint: "white" },
  { id: "achernar", name: "Achernar", con: "Eridanus", ra: 24.429, dec: -57.237, mag: 0.46, ly: 139, tint: "blue" },
  { id: "betelgeuse", name: "Betelgeuse", con: "Orion", ra: 88.793, dec: 7.407, mag: 0.5, ly: 550, age: "~8–10 million years", tint: "red" },
  { id: "hadar", name: "Hadar", con: "Centaurus", ra: 210.956, dec: -60.373, mag: 0.61, ly: 390, tint: "blue" },
  { id: "altair", name: "Altair", con: "Aquila", ra: 297.696, dec: 8.868, mag: 0.76, ly: 16.7, age: "~100 million years", tint: "white" },
  { id: "acrux", name: "Acrux", con: "Crux", ra: 186.65, dec: -63.099, mag: 0.76, ly: 320, tint: "blue" },
  { id: "aldebaran", name: "Aldebaran", con: "Taurus", ra: 68.98, dec: 16.509, mag: 0.86, ly: 65, age: "~6 billion years", tint: "orange" },
  { id: "antares", name: "Antares", con: "Scorpius", ra: 247.352, dec: -26.432, mag: 0.96, ly: 550, age: "~12 million years", tint: "red" },
  { id: "spica", name: "Spica", con: "Virgo", ra: 201.298, dec: -11.161, mag: 0.97, ly: 250, age: "~12 million years", tint: "blue" },
  { id: "pollux", name: "Pollux", con: "Gemini", ra: 116.329, dec: 28.026, mag: 1.14, ly: 34, age: "~720 million years", tint: "orange" },
  { id: "fomalhaut", name: "Fomalhaut", con: "Piscis Austrinus", ra: 344.413, dec: -29.622, mag: 1.16, ly: 25, age: "~440 million years", tint: "white" },
  { id: "deneb", name: "Deneb", con: "Cygnus", ra: 310.358, dec: 45.28, mag: 1.25, ly: 2600, age: "~10 million years", tint: "white" },
  { id: "mimosa", name: "Mimosa", con: "Crux", ra: 191.93, dec: -59.689, mag: 1.25, ly: 280, tint: "blue" },
  { id: "regulus", name: "Regulus", con: "Leo", ra: 152.093, dec: 11.967, mag: 1.35, ly: 79, tint: "blue" },
  { id: "adhara", name: "Adhara", con: "Canis Major", ra: 104.656, dec: -28.972, mag: 1.5, tint: "blue" },
  { id: "castor", name: "Castor", con: "Gemini", ra: 113.65, dec: 31.888, mag: 1.58, ly: 51, tint: "white" },
  { id: "shaula", name: "Shaula", con: "Scorpius", ra: 263.402, dec: -37.104, mag: 1.62, tint: "blue" },
  { id: "gacrux", name: "Gacrux", con: "Crux", ra: 187.791, dec: -57.113, mag: 1.64, tint: "red" },
  { id: "bellatrix", name: "Bellatrix", con: "Orion", ra: 81.283, dec: 6.35, mag: 1.64, ly: 250, tint: "blue" },
  { id: "elnath", name: "Elnath", con: "Taurus", ra: 81.573, dec: 28.608, mag: 1.65, tint: "blue" },
  { id: "alnilam", name: "Alnilam", con: "Orion", ra: 84.053, dec: -1.202, mag: 1.69, tint: "blue" },
  { id: "alnitak", name: "Alnitak", con: "Orion", ra: 85.19, dec: -1.943, mag: 1.77, tint: "blue" },
  { id: "alioth", name: "Alioth", con: "Ursa Major", ra: 193.507, dec: 55.96, mag: 1.77, tint: "white" },
  { id: "dubhe", name: "Dubhe", con: "Ursa Major", ra: 165.932, dec: 61.751, mag: 1.79, ly: 123, tint: "orange" },
  { id: "mirfak", name: "Mirfak", con: "Perseus", ra: 51.081, dec: 49.861, mag: 1.79, tint: "yellow" },
  { id: "wezen", name: "Wezen", con: "Canis Major", ra: 107.098, dec: -26.393, mag: 1.84, tint: "yellow" },
  { id: "kausaustralis", name: "Kaus Australis", con: "Sagittarius", ra: 276.043, dec: -34.385, mag: 1.85, tint: "blue" },
  { id: "sargas", name: "Sargas", con: "Scorpius", ra: 264.33, dec: -42.998, mag: 1.86, tint: "yellow" },
  { id: "alkaid", name: "Alkaid", con: "Ursa Major", ra: 206.885, dec: 49.313, mag: 1.86, ly: 104, tint: "blue" },
  { id: "alhena", name: "Alhena", con: "Gemini", ra: 99.428, dec: 16.399, mag: 1.9, tint: "white" },
  { id: "peacock", name: "Peacock", con: "Pavo", ra: 306.412, dec: -56.735, mag: 1.94, tint: "blue" },
  { id: "polaris", name: "Polaris", con: "Ursa Minor", ra: 37.954, dec: 89.264, mag: 1.98, ly: 430, age: "~70 million years", tint: "yellow" },
  { id: "mirzam", name: "Mirzam", con: "Canis Major", ra: 95.675, dec: -17.956, mag: 1.98, tint: "blue" },
  { id: "alphard", name: "Alphard", con: "Hydra", ra: 141.897, dec: -8.659, mag: 1.98, tint: "orange" },
  { id: "hamal", name: "Hamal", con: "Aries", ra: 31.793, dec: 23.463, mag: 2.0, tint: "orange" },
  { id: "diphda", name: "Diphda", con: "Cetus", ra: 10.897, dec: -17.987, mag: 2.04, tint: "orange" },
  { id: "nunki", name: "Nunki", con: "Sagittarius", ra: 283.816, dec: -26.297, mag: 2.05, tint: "blue" },
  { id: "algieba", name: "Algieba", con: "Leo", ra: 154.993, dec: 19.842, mag: 2.08, tint: "orange" },
  { id: "kochab", name: "Kochab", con: "Ursa Minor", ra: 222.676, dec: 74.156, mag: 2.08, tint: "orange" },
  { id: "saiph", name: "Saiph", con: "Orion", ra: 86.939, dec: -9.67, mag: 2.09, tint: "blue" },
  { id: "denebola", name: "Denebola", con: "Leo", ra: 177.265, dec: 14.572, mag: 2.14, ly: 36, tint: "white" },
  { id: "mizar", name: "Mizar", con: "Ursa Major", ra: 200.981, dec: 54.925, mag: 2.23, ly: 83, tint: "white" },
  { id: "mintaka", name: "Mintaka", con: "Orion", ra: 83.002, dec: -0.299, mag: 2.23, tint: "blue" },
  { id: "sadr", name: "Sadr", con: "Cygnus", ra: 305.557, dec: 40.257, mag: 2.23, tint: "yellow" },
  { id: "schedar", name: "Schedar", con: "Cassiopeia", ra: 10.127, dec: 56.537, mag: 2.24, tint: "orange" },
  { id: "caph", name: "Caph", con: "Cassiopeia", ra: 2.295, dec: 59.15, mag: 2.28, tint: "white" },
  { id: "larawag", name: "Larawag", con: "Scorpius", ra: 252.541, dec: -34.293, mag: 2.29, tint: "orange" },
  { id: "dschubba", name: "Dschubba", con: "Scorpius", ra: 240.083, dec: -22.622, mag: 2.32, tint: "blue" },
  { id: "merak", name: "Merak", con: "Ursa Major", ra: 165.46, dec: 56.383, mag: 2.37, tint: "white" },
  { id: "kappasco", name: "Girtab", con: "Scorpius", ra: 265.622, dec: -39.03, mag: 2.39, tint: "blue" },
  { id: "phecda", name: "Phecda", con: "Ursa Major", ra: 178.458, dec: 53.695, mag: 2.44, tint: "white" },
  { id: "aludra", name: "Aludra", con: "Canis Major", ra: 111.024, dec: -29.303, mag: 2.45, tint: "blue" },
  { id: "navi", name: "Navi", con: "Cassiopeia", ra: 14.177, dec: 60.717, mag: 2.47, tint: "blue" },
  { id: "aljanah", name: "Aljanah", con: "Cygnus", ra: 311.553, dec: 33.97, mag: 2.48, tint: "orange" },
  { id: "zosma", name: "Zosma", con: "Leo", ra: 168.527, dec: 20.524, mag: 2.56, tint: "white" },
  { id: "ascella", name: "Ascella", con: "Sagittarius", ra: 285.653, dec: -29.88, mag: 2.6, tint: "white" },
  { id: "acrab", name: "Acrab", con: "Scorpius", ra: 241.359, dec: -19.806, mag: 2.62, tint: "blue" },
  { id: "ruchbah", name: "Ruchbah", con: "Cassiopeia", ra: 21.454, dec: 60.235, mag: 2.68, tint: "white" },
  { id: "lesath", name: "Lesath", con: "Scorpius", ra: 262.691, dec: -37.296, mag: 2.7, tint: "blue" },
  { id: "kausmedia", name: "Kaus Media", con: "Sagittarius", ra: 275.248, dec: -29.828, mag: 2.7, tint: "orange" },
  { id: "tarazed", name: "Tarazed", con: "Aquila", ra: 296.565, dec: 10.613, mag: 2.72, tint: "orange" },
  { id: "imai", name: "Imai", con: "Crux", ra: 183.786, dec: -58.749, mag: 2.79, tint: "blue" },
  { id: "kausborealis", name: "Kaus Borealis", con: "Sagittarius", ra: 276.993, dec: -25.422, mag: 2.81, tint: "orange" },
  { id: "tausco", name: "Paikauhale", con: "Scorpius", ra: 248.971, dec: -28.216, mag: 2.82, tint: "blue" },
  { id: "tejat", name: "Tejat", con: "Gemini", ra: 95.74, dec: 22.514, mag: 2.87, tint: "red" },
  { id: "alcyone", name: "Alcyone", con: "Taurus", ra: 56.871, dec: 24.105, mag: 2.87, ly: 440, tint: "blue" },
  { id: "fawaris", name: "Fawaris", con: "Cygnus", ra: 296.244, dec: 45.131, mag: 2.87, tint: "white" },
  { id: "pisco", name: "Fang", con: "Scorpius", ra: 239.713, dec: -26.114, mag: 2.89, tint: "blue" },
  { id: "alniyat", name: "Alniyat", con: "Scorpius", ra: 245.297, dec: -25.593, mag: 2.89, tint: "blue" },
  { id: "mebsuta", name: "Mebsuta", con: "Gemini", ra: 100.983, dec: 25.131, mag: 2.98, tint: "yellow" },
  { id: "raselased", name: "Ras Elased", con: "Leo", ra: 146.463, dec: 23.774, mag: 2.98, tint: "yellow" },
  { id: "alnasl", name: "Alnasl", con: "Sagittarius", ra: 271.452, dec: -30.424, mag: 2.99, tint: "orange" },
  { id: "iotasco", name: "Iota Scorpii", con: "Scorpius", ra: 266.896, dec: -40.127, mag: 2.99, tint: "yellow" },
  { id: "tianguan", name: "Tianguan", con: "Taurus", ra: 84.411, dec: 21.142, mag: 3.0, tint: "blue" },
  { id: "musco", name: "Xamidimura", con: "Scorpius", ra: 252.968, dec: -38.047, mag: 3.0, tint: "blue" },
  { id: "albireo", name: "Albireo", con: "Cygnus", ra: 292.68, dec: 27.96, mag: 3.05, ly: 430, tint: "orange" },
  { id: "phisgr", name: "Phi Sagittarii", con: "Sagittarius", ra: 281.414, dec: -26.991, mag: 3.17, tint: "blue" },
  { id: "sulafat", name: "Sulafat", con: "Lyra", ra: 284.736, dec: 32.69, mag: 3.25, tint: "blue" },
  { id: "megrez", name: "Megrez", con: "Ursa Major", ra: 183.857, dec: 57.033, mag: 3.31, tint: "white" },
  { id: "tausgr", name: "Tau Sagittarii", con: "Sagittarius", ra: 286.735, dec: -27.67, mag: 3.32, tint: "orange" },
  { id: "etasco", name: "Eta Scorpii", con: "Scorpius", ra: 258.038, dec: -43.239, mag: 3.33, tint: "white" },
  { id: "chertan", name: "Chertan", con: "Leo", ra: 168.56, dec: 15.43, mag: 3.33, tint: "white" },
  { id: "segin", name: "Segin", con: "Cassiopeia", ra: 28.599, dec: 63.67, mag: 3.37, tint: "blue" },
  { id: "meissa", name: "Meissa", con: "Orion", ra: 83.784, dec: 9.934, mag: 3.39, tint: "blue" },
  { id: "adhafera", name: "Adhafera", con: "Leo", ra: 154.173, dec: 23.417, mag: 3.44, tint: "white" },
  { id: "etaleo", name: "Al Jabhah", con: "Leo", ra: 151.833, dec: 16.763, mag: 3.5, tint: "white" },
  { id: "sheliak", name: "Sheliak", con: "Lyra", ra: 282.52, dec: 33.363, mag: 3.52, tint: "blue" },
  { id: "wasat", name: "Wasat", con: "Gemini", ra: 110.031, dec: 21.982, mag: 3.53, tint: "white" },
  { id: "ain", name: "Ain", con: "Taurus", ra: 67.154, dec: 19.18, mag: 3.53, tint: "orange" },
  { id: "zetasco", name: "Zeta Scorpii", con: "Scorpius", ra: 253.646, dec: -42.361, mag: 3.62, tint: "orange" },
  { id: "prima", name: "Prima Hyadum", con: "Taurus", ra: 64.948, dec: 15.628, mag: 3.65, tint: "orange" },
  { id: "alshain", name: "Alshain", con: "Aquila", ra: 298.828, dec: 6.407, mag: 3.71, tint: "yellow" },
  { id: "secunda", name: "Secunda Hyadum", con: "Taurus", ra: 65.734, dec: 17.543, mag: 3.76, tint: "orange" },
  { id: "rasalas", name: "Rasalas", con: "Leo", ra: 148.191, dec: 26.007, mag: 3.88, tint: "orange" },
  { id: "deltalyr", name: "Delta Lyrae", con: "Lyra", ra: 283.626, dec: 36.899, mag: 4.3, tint: "red" },
  { id: "zetalyr", name: "Zeta Lyrae", con: "Lyra", ra: 281.193, dec: 37.605, mag: 4.36, tint: "white" },
];

export const STAR_BY_ID: Record<string, Star> = Object.fromEntries(STARS.map((s) => [s.id, s]));

/** Stick figures, as pairs of star ids. */
export const LINES: [string, string][] = [
  // Orion
  ["betelgeuse", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"], ["mintaka", "alnilam"], ["alnilam", "alnitak"],
  ["alnitak", "saiph"], ["mintaka", "rigel"], ["meissa", "betelgeuse"], ["meissa", "bellatrix"],
  // Ursa Major (the Plough)
  ["dubhe", "merak"], ["merak", "phecda"], ["phecda", "megrez"], ["megrez", "dubhe"], ["megrez", "alioth"], ["alioth", "mizar"], ["mizar", "alkaid"],
  // Cassiopeia
  ["caph", "schedar"], ["schedar", "navi"], ["navi", "ruchbah"], ["ruchbah", "segin"],
  // Cygnus
  ["deneb", "sadr"], ["sadr", "albireo"], ["fawaris", "sadr"], ["sadr", "aljanah"],
  // Lyra
  ["vega", "zetalyr"], ["vega", "deltalyr"], ["zetalyr", "sheliak"], ["deltalyr", "sulafat"], ["sheliak", "sulafat"], ["zetalyr", "deltalyr"],
  // Aquila
  ["tarazed", "altair"], ["altair", "alshain"],
  // Scorpius
  ["acrab", "dschubba"], ["dschubba", "pisco"], ["dschubba", "alniyat"], ["alniyat", "antares"], ["antares", "tausco"], ["tausco", "larawag"],
  ["larawag", "musco"], ["musco", "zetasco"], ["zetasco", "etasco"], ["etasco", "sargas"], ["sargas", "iotasco"], ["iotasco", "kappasco"],
  ["kappasco", "shaula"], ["shaula", "lesath"],
  // Sagittarius (the Teapot)
  ["alnasl", "kausmedia"], ["kausmedia", "kausaustralis"], ["kausaustralis", "alnasl"], ["kausmedia", "kausborealis"], ["kausborealis", "phisgr"],
  ["phisgr", "kausmedia"], ["phisgr", "nunki"], ["nunki", "tausgr"], ["tausgr", "ascella"], ["ascella", "phisgr"], ["ascella", "kausaustralis"],
  // Crux
  ["acrux", "gacrux"], ["mimosa", "imai"],
  // Gemini
  ["castor", "pollux"], ["castor", "mebsuta"], ["mebsuta", "tejat"], ["pollux", "wasat"], ["wasat", "alhena"],
  // Taurus
  ["aldebaran", "ain"], ["ain", "elnath"], ["aldebaran", "prima"], ["prima", "secunda"], ["secunda", "ain"], ["aldebaran", "tianguan"],
  // Leo
  ["regulus", "etaleo"], ["etaleo", "algieba"], ["algieba", "adhafera"], ["adhafera", "rasalas"], ["rasalas", "raselased"],
  ["algieba", "zosma"], ["zosma", "denebola"], ["denebola", "chertan"], ["chertan", "regulus"], ["zosma", "chertan"],
  // Canis Major
  ["sirius", "mirzam"], ["sirius", "adhara"], ["adhara", "wezen"], ["wezen", "aludra"], ["sirius", "wezen"],
  // Ursa Minor (partial)
  ["polaris", "kochab"],
];

export const CONSTELLATIONS = [
  "Orion", "Ursa Major", "Cassiopeia", "Cygnus", "Lyra", "Aquila", "Scorpius", "Sagittarius", "Crux", "Gemini", "Taurus", "Leo", "Canis Major",
] as const;

/** Dark-sky places. Coordinates are approximate site centres. */
export type Place = { id: string; name: string; region: string; lat: number; lon: number; note: string };
export const PLACES: Place[] = [
  { id: "hanle", name: "Hanle Dark Sky Reserve", region: "Ladakh, India", lat: 32.78, lon: 78.96, note: "4,500 m up, dry air, India's first dark sky reserve." },
  { id: "spiti", name: "Kaza & Langza", region: "Spiti, India", lat: 32.27, lon: 78.07, note: "High desert villages with very little stray light." },
  { id: "rann", name: "White Rann", region: "Kutch, India", lat: 23.87, lon: 69.73, note: "Salt flats with a horizon in every direction." },
  { id: "namibrand", name: "NamibRand Reserve", region: "Namibia", lat: -25.0, lon: 16.0, note: "Desert reserve, one of the darkest in the world." },
  { id: "aoraki", name: "Aoraki Mackenzie", region: "New Zealand", lat: -44.0, lon: 170.5, note: "Southern skies, the Magellanic Clouds overhead." },
  { id: "atacama", name: "Atacama Desert", region: "Chile", lat: -23.0, lon: -67.9, note: "Where the big observatories go for the clearest nights." },
  { id: "cherry", name: "Cherry Springs", region: "Pennsylvania, USA", lat: 41.66, lon: -77.82, note: "A hilltop park kept dark on purpose." },
  { id: "galloway", name: "Galloway Forest", region: "Scotland", lat: 55.1, lon: -4.5, note: "Forest park with deep winter darkness." },
];
