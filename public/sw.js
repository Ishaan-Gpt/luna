// Luna's service worker: keeps the app, its star catalogue and the on-device AI runtime available offline.
// Models themselves live in the "luna-models-v1" cache, written by the app.
const V = "luna-shell-v1";
const CORE = [
  "/sky",
  "/manifest.webmanifest",
  "/data/sky-catalog.json",
  "/mediapipe/wasm/genai_wasm_internal.js",
  "/mediapipe/wasm/genai_wasm_internal.wasm",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(V).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== V && k !== "luna-models-v1").map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/art/") || url.pathname.startsWith("/data/") || url.pathname.startsWith("/mediapipe/") || url.pathname.startsWith("/icons/") || url.hostname === "fonts.gstatic.com";

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && url.hostname !== "fonts.gstatic.com") return; // forecasts and model downloads go straight to the network

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(V).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/sky")) || Response.error()),
    );
    return;
  }
  if (isStatic(url)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(V).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }
  e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())));
});
