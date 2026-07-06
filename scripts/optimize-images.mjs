import { readFile, writeFile, rename } from "node:fs/promises";
import { walkImages, optimizeBuffer, RASTER } from "./lib/images.mjs";

const CONTENT = new URL("../content/", import.meta.url).pathname;
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;

const files = await walkImages(CONTENT, RASTER);
let savedTotal = 0;
for (const path of files) {
  const buffer = await readFile(path);
  const out = await optimizeBuffer(buffer, { maxWidth: MAX_WIDTH, jpegQuality: JPEG_QUALITY });
  if (!out) continue;
  const tmp = `${path}.tmp`;
  await writeFile(tmp, out);
  await rename(tmp, path); // 원자적 교체
  savedTotal += buffer.length - out.length;
  console.log(
    `  ${(buffer.length / 1024).toFixed(0)}→${(out.length / 1024).toFixed(0)}KB  ${path.replace(CONTENT, "content/")}`,
  );
}
console.log(savedTotal ? `\n✓ 총 ${(savedTotal / 1024).toFixed(0)}KB 절감` : "최적화할 이미지 없음(이미 경량)");
