// Self-host MediaPipe's GenAI runtime so on-device inference works offline (no CDN at runtime).
import fs from "node:fs/promises";
const src = "node_modules/@mediapipe/tasks-genai/wasm";
const dst = "public/mediapipe/wasm";
await fs.mkdir(dst, { recursive: true });
for (const f of ["genai_wasm_internal.js", "genai_wasm_internal.wasm", "genai_wasm_nosimd_internal.js", "genai_wasm_nosimd_internal.wasm"]) {
  await fs.copyFile(`${src}/${f}`, `${dst}/${f}`);
}
console.log("MediaPipe GenAI runtime copied to", dst);
