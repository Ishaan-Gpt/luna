// Luna voice pack: short spoken stories for the brightest stars, planets and a few deep-sky objects,
// rendered once with ElevenLabs and shipped as static MP3s, so they play offline and no key ships in the app.
//   ELEVENLABS_API_KEY in .env.local, then: node scripts/voice-pack.mjs [--demo]
import fs from "node:fs/promises";
import path from "node:path";

async function key() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  for (const f of [".env.local", ".env"]) {
    try {
      const m = (await fs.readFile(f, "utf8")).match(/^\s*ELEVENLABS_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
      if (m) return m[1].trim();
    } catch {}
  }
  throw new Error("ELEVENLABS_API_KEY not found in the environment, .env.local or .env");
}

// Each line is written to be said under the sky: what it is, one fact worth remembering.
export const STORIES = {
  "hip:32349": ["Sirius", "Sirius is the brightest star in the night sky, just eight point six light years away. It has a faint companion, a white dwarf the size of Earth."],
  "hip:30438": ["Canopus", "Canopus is the second brightest star in the sky. Spacecraft have used it as a fixed point to keep their bearings."],
  "hip:69673": ["Arcturus", "Arcturus is an orange giant thirty seven light years away. Follow the curve of the Big Dipper's handle and arc to Arcturus."],
  "hip:91262": ["Vega", "Vega, in Lyra, is twenty five light years away. In about twelve thousand years, Earth's wobble will make it our pole star."],
  "hip:24608": ["Capella", "Capella looks like one star, but it is two pairs of stars, forty three light years away, shining as one golden point."],
  "hip:24436": ["Rigel", "Rigel marks Orion's foot. It is a blue supergiant hundreds of light years away, tens of thousands of times brighter than the Sun."],
  "hip:37279": ["Procyon", "Procyon's name means before the dog: it rises just before Sirius, the Dog Star. It is only eleven light years away."],
  "hip:27989": ["Betelgeuse", "Betelgeuse is the red shoulder of Orion, a supergiant so large it would swallow the orbit of Mars. In 2020 it dimmed so much that astronomers wondered if it was about to explode."],
  "hip:97649": ["Altair", "Altair spins so fast, about once every nine hours, that it bulges at its equator. It is seventeen light years away."],
  "hip:21421": ["Aldebaran", "Aldebaran is the orange eye of Taurus the bull. It looks like part of the Hyades cluster around it, but it is much closer to us."],
  "hip:80763": ["Antares", "Antares is the red heart of Scorpius. Its name means rival of Mars, because the two look so alike."],
  "hip:65474": ["Spica", "Spica, in Virgo, is two hot blue stars orbiting each other so closely they are stretched into egg shapes."],
  "hip:37826": ["Pollux", "Pollux is the brighter twin in Gemini, an orange giant with a planet of its own."],
  "hip:102098": ["Deneb", "Deneb, the tail of Cygnus the swan, is one of the most luminous stars you can see. It is so far away that its distance is still uncertain."],
  "hip:11767": ["Polaris", "Polaris, the North Star, sits less than one degree from the celestial pole, so the whole northern sky seems to turn around it."],
  "hip:113368": ["Fomalhaut", "Fomalhaut is often called the lonely star of autumn, bright in an empty part of the sky. A ring of dust circles it."],
  "hip:49669": ["Regulus", "Regulus is the heart of Leo. It sits so close to the Sun's path that the Moon often passes right in front of it."],
  moon: ["The Moon", "The Moon always shows us the same face. The dark patches you can see are old seas of lava, billions of years old."],
  "planet:jupiter": ["Jupiter", "Jupiter is the largest planet. Hold a pair of binoculars steady and you can see up to four of its moons in a line beside it."],
  "planet:saturn": ["Saturn", "Saturn looks like a steady golden star. Even a small telescope shows its rings."],
  "planet:mars": ["Mars", "Mars gets its colour from rusted iron in its dust. Every two years it swings close to Earth and shines brighter."],
  "planet:venus": ["Venus", "Venus is the brightest planet, wrapped in thick cloud. Through binoculars you can see it show phases, like a tiny moon."],
  "dso:NGC 1976": ["The Orion Nebula", "The fuzzy patch in Orion's sword is the Orion Nebula, a nursery where new stars are forming, more than a thousand light years away."],
  "dso:M 45": ["The Pleiades", "The Pleiades, or Seven Sisters, is a cluster of young blue stars. Most people can count six; dark skies show many more."],
  "dso:NGC 224": ["The Andromeda Galaxy", "The Andromeda Galaxy is about two and a half million light years away. The light you see left it before our species existed."],
};

const DEMO = `This is Luna, a night-sky guide that runs on an open model inside your phone. Before it shows you anything, it asks you to look up. Point your phone at the sky and ask what you are seeing. Gemma answers on the device, every claim is checked against the sky itself, and then Luna asks you to put the phone away.`;

async function pickVoice(k) {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": k } });
  if (!r.ok) throw new Error(`Listing voices failed: ${r.status} ${await r.text()}`);
  const { voices } = await r.json();
  const prefer = ["George", "Daniel", "Brian", "Alice", "Matilda", "Rachel"];
  const v = prefer.map((n) => voices.find((x) => x.name?.startsWith(n))).find(Boolean) ?? voices[0];
  console.log("voice:", v.name, v.voice_id);
  return v.voice_id;
}

async function speak(k, voice, text, file) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": k, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.7 } }),
  });
  if (!r.ok) throw new Error(`TTS failed for ${file}: ${r.status} ${await r.text()}`);
  await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
}

const k = await key();
const voice = await pickVoice(k);
const out = path.resolve("public/voice");
await fs.mkdir(out, { recursive: true });
if (process.argv.includes("--demo")) {
  await speak(k, voice, DEMO, path.join(out, "demo-narration.mp3"));
  console.log("demo-narration.mp3");
} else {
  const manifest = {};
  for (const [id, [name, text]] of Object.entries(STORIES)) {
    const file = `${id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.mp3`;
    await speak(k, voice, text, path.join(out, file));
    manifest[id] = { name, text, file: `/voice/${file}` };
    console.log(file);
  }
  await fs.writeFile(path.join(out, "manifest.json"), JSON.stringify({ voice, source: "ElevenLabs eleven_multilingual_v2", stories: manifest }, null, 2));
  console.log(`${Object.keys(manifest).length} stories → public/voice/manifest.json`);
}
