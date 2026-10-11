// Headless screenshots for visual checks, driven over the Chrome DevTools Protocol.
//   node scripts/shots.mjs <outDir> <width> <height> [y|#selector|@sections ...]
// "@sections" captures the top of every <main> section and the footer.
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const [outDir, W = "1440", H = "900", ...targets] = process.argv.slice(2);
const URL_ = process.env.SHOT_URL ?? "http://localhost:3210/";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9333 + Math.floor(Math.random() * 400);
const profile = await fs.mkdtemp(path.join(os.tmpdir(), "luna-shots-"));
const chrome = spawn(CHROME, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--force-device-scale-factor=1", "--no-first-run", ...(process.env.SHOT_FLAGS ? process.env.SHOT_FLAGS.split(" ") : []), "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
    const t = await r.json();
    ws = new WebSocket(t.webSocketDebuggerUrl);
    break;
  } catch {
    await sleep(200);
  }
}
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown") console.log("PAGE ERROR:", m.params.exceptionDetails?.exception?.description?.split(String.fromCharCode(10)).slice(0, 3).join(" | ") ?? m.params.exceptionDetails?.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") console.log("CONSOLE ERROR:", m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300));
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable");
if (process.env.SHOT_INIT) await send("Page.addScriptToEvaluateOnNewDocument", { source: process.env.SHOT_INIT });
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 600 });
// SHOT_UA=android|ios pretends to be that phone (user agent + touch), for platform-specific screens.
const UAS = {
  android: "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1",
};
if (process.env.SHOT_UA) {
  await send("Emulation.setUserAgentOverride", { userAgent: UAS[process.env.SHOT_UA] ?? process.env.SHOT_UA });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
}
await fs.mkdir(outDir, { recursive: true });

async function shoot(y, name) {
  const [base, hash] = URL_.split("#");
  await send("Page.navigate", { url: `${base}${base.includes("?") ? "&" : "?"}shot=${y}${hash ? `#${hash}` : ""}` });
  await sleep(Number(process.env.SHOT_WAIT ?? 4200));
  if (process.env.SHOT_OFFLINE) {
    // first visit done: now cut the network and reload, like airplane mode
    await send("Network.enable");
    await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await send("Page.reload", { ignoreCache: false });
    await sleep(Number(process.env.SHOT_WAIT ?? 4200));
  }
  if (process.env.SHOT_ACTION) {
    console.log("action:", JSON.stringify(await evaluate(process.env.SHOT_ACTION)));
    await sleep(Number(process.env.SHOT_AFTER ?? 2500));
  }
  if (process.env.SHOT_EVAL) console.log("eval@" + y, JSON.stringify(await evaluate(process.env.SHOT_EVAL)));
  const { result } = await send("Page.captureScreenshot", { format: "jpeg", quality: 72 });
  const file = path.join(outDir, `${name}.jpg`);
  await fs.writeFile(file, Buffer.from(result.data, "base64"));
  return file;
}

let list = targets;
if (targets.includes("@sections")) {
  await send("Page.navigate", { url: `${URL_}?shot=0` });
  await sleep(3500);
  const tops = await evaluate(`[...document.querySelectorAll('main > section, footer')].map(e => Math.round(e.getBoundingClientRect().top + scrollY))`);
  console.log("section tops:", tops.join(", "), "height:", await evaluate("document.documentElement.scrollHeight"));
  list = tops.map(String);
}
for (const [k, t] of list.entries()) {
  const y = Number(t);
  console.log(await shoot(y, `${String(k).padStart(2, "0")}-y${y}`));
}
ws.close();
chrome.kill();
await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
