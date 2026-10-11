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
const chrome = spawn(CHROME, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--force-device-scale-factor=1", "--no-first-run", "about:blank"], { stdio: "ignore" });

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
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 600 });
await fs.mkdir(outDir, { recursive: true });

async function shoot(y, name) {
  await send("Page.navigate", { url: `${URL_}?shot=${y}` });
  await sleep(4200);
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
