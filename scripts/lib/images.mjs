import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";

export const RASTER = new Set([".png", ".jpg", ".jpeg"]);
export const GATE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);

/** dir 하위를 재귀 walk하여 exts에 맞는 파일 절대경로 배열 반환 */
export async function walkImages(dir, exts) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out; // 디렉토리 없으면 빈 배열
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkImages(full, exts)));
    else if (exts.has(extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

/** 순수: entries 중 limit(byte) 초과분을 size 내림차순으로 반환 */
export function collectOversized(entries, limit) {
  return entries.filter((e) => e.size > limit).sort((a, b) => b.size - a.size);
}

/**
 * 버퍼를 maxWidth로 리사이즈+재압축. 결과가 원본보다 작을 때만 Buffer 반환, 아니면 null.
 * jpeg/png만 처리(그 외 포맷 → null).
 */
export async function optimizeBuffer(buffer, { maxWidth, jpegQuality }) {
  const img = sharp(buffer, { failOn: "none" });
  const meta = await img.metadata();
  const format = (meta.format ?? "").toLowerCase();
  let pipe = img;
  if (meta.width && meta.width > maxWidth) {
    pipe = pipe.resize({ width: maxWidth, withoutEnlargement: true });
  }
  if (format === "jpeg" || format === "jpg") {
    pipe = pipe.jpeg({ quality: jpegQuality, mozjpeg: true });
  } else if (format === "png") {
    pipe = pipe.png({ compressionLevel: 9, palette: true });
  } else {
    return null;
  }
  const out = await pipe.toBuffer();
  return out.length < buffer.length ? out : null;
}
