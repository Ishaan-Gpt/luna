# Luna

**A night-sky guide you set up by looking up, ask by pointing, and finish by putting your phone away.**
Built for the [Hacktoberfest 2026 Open-Source AI Challenge, Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).

- **Landing:** `/`
- **Get the app:** `/get`, which detects the device: an Android APK (plus Chrome's one-tap install), Add to Home Screen steps for iPhone, and on a computer a plain "Luna lives on your phone" screen with a QR code and an honest preview
- **App:** `/sky` (installable, works offline after one visit)
- **Printable planisphere:** `/sky/print?lat=32.78`

Luna is a phone app. It needs a compass, tilt sensors, GPS and the sky above you, so on a computer it says so up front and offers a preview (sky map, Tonight, Ask with Gemma, Places) with the phone-only features listed.

## What it does

| Feature | How it works |
|---|---|
| **Sky Check** | Setup asks you to look up. Luna draws the constellation best placed in *your* sky right now at five faintness levels (real catalogue stars) and you pick the one that matches. That sets your limiting magnitude, and Luna hides anything fainter. |
| **Sky lens** | 5,044 real stars, all 88 constellation figures, planets, the Moon and bright deep-sky objects, computed for your place and time. Follows your phone's compass and tilt, or drag and zoom on a laptop. Any date from 1000 to 2999, with precession. |
| **Ask** | Questions go to **Gemma 4 E2B running in your browser on WebGPU**. The model never states a position from memory: Luna's sky engine computes the facts, Gemma phrases the answer, and a verifier checks every object, direction, height and time before you see or hear it. Wrong answers are replaced and the reason is shown. |
| **Tonight** | Truly dark window, best moon-free stretch, sun and moon in degrees, rise and set times, cloud cover (Open-Meteo, cached for offline), upcoming moon phases, eclipses, meteor showers and solstices. |
| **Places** | Dark-sky sites sorted by distance. *Navigate* uses live GPS and the compass to point an arrow and count down the distance, with no signal needed. Maps takes over for turn-by-turn when you have one. |
| **Mine** | Marked stars with rise, peak and set times, nicknames (stored only on your device), rise alerts while Luna is open, tonight's sky as a lock-screen image, and a cut-and-pin paper planisphere for your latitude. |

## Architecture

```
Browser (works offline after one visit)
├─ Sky engine ─ astronomy-engine (sun, moon, planets, rise/set, eclipses) + Hipparcos catalogue
├─ Sensors ──── DeviceOrientation → where the back camera points (az/alt); GPS via watchPosition
├─ Brain ────── Gemma 4 E2B (.task, 2.0 GB) on WebGPU via MediaPipe LLM Inference
│               downloaded once into Cache Storage, stream-loaded from there
├─ Grounding ── facts → prompt → Gemma → verifier (objects, compass directions, fists/degrees, clock times)
└─ Service worker ─ caches the app, catalogue and the MediaPipe runtime
Android app ─ a Trusted Web Activity (android/, built with Bubblewrap): the same app running in Chrome's engine,
               full screen via Digital Asset Links (public/.well-known/assetlinks.json)
Server: static Next.js pages only. No location or question ever leaves the device
(except the optional cloud forecast request to Open-Meteo, which sends only rounded coordinates).
```

Key files:
- `src/lib/ground.ts`: subject resolution, the facts builder and the verifier
- `src/lib/brain.ts`: model download, cache and load, plus streaming generation
- `src/lib/lens.ts`: sky computation and drawing for the app
- `src/lib/sensors.ts`: phone orientation to pointing direction
- `scripts/build-catalog.mjs`: builds `public/data/sky-catalog.json` from d3-celestial data
- `scripts/render-night.mjs`: the procedural night art used on the landing page
- `scripts/shots.mjs`: the headless Chrome harness used to verify every screen (including offline and on-device Gemma runs)

## Run it

```bash
npm install        # also copies the MediaPipe runtime into public/mediapipe
npm run catalog    # rebuild the star catalogue (already committed)
npm run dev        # http://localhost:3000
npm run build && npm start
```

Gemma runs in Chrome or Edge with WebGPU (desktop), and on recent phones with enough memory. On devices without WebGPU, Ask still answers from the sky engine and says so.

## Honesty notes

- Star positions come from the Hipparcos catalogue. The Milky Way glow on the landing page is drawn along the real galactic plane. The landing's night scenes are procedural art, labelled as such in the source.
- Distances and ages of named stars are published estimates and are shown as such.
- Voice input uses the browser's speech recognition, which usually needs a connection. Typing works fully offline, and spoken answers use on-device voices.
- Rise alerts fire while Luna is open in a tab or installed as an app. There is no push server.
- The Android APK is signed with our own key and installed from the site, not the Play Store, so Android asks you to allow the install. iPhone apps can only be downloaded from the App Store, so on iPhone Luna installs from Safari as a home-screen web app.
- Render's free plan sleeps when idle. The service worker serves the cached app after 3.5 seconds instead of waiting on a waking server, so the installed app still opens quickly.

## Credits and licences

- [Gemma 4](https://ai.google.dev/gemma) by Google DeepMind (Apache 2.0), via [litert-community](https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm)
- [MediaPipe LLM Inference](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference) (Apache 2.0)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT)
- Star, constellation and deep-sky data from [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3-Clause), stars from Hipparcos
- Forecasts by [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- GSAP, Lenis, Next.js, Tailwind CSS
