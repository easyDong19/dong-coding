import { expect, test } from "vitest";
import sharp from "sharp";
import { collectOversized, optimizeBuffer } from "./images.mjs";

test("collectOversized: limit 초과분만 size 내림차순", () => {
  const entries = [
    { path: "a", size: 100 },
    { path: "b", size: 900 },
    { path: "c", size: 500 },
  ];
  expect(collectOversized(entries, 400)).toEqual([
    { path: "b", size: 900 },
    { path: "c", size: 500 },
  ]);
});

test("collectOversized: 모두 이하 → 빈 배열", () => {
  expect(collectOversized([{ path: "a", size: 100 }], 400)).toEqual([]);
});

test("optimizeBuffer: 큰 이미지를 maxWidth로 축소하고 더 작게 만든다", async () => {
  const big = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 120, g: 80, b: 40 } },
  }).png().toBuffer();
  const out = await optimizeBuffer(big, { maxWidth: 1600, jpegQuality: 80 });
  expect(out).not.toBeNull();
  if (out === null) throw new Error("optimizeBuffer returned null");
  const meta = await sharp(out).metadata();
  expect(meta.width).toBe(1600);
  expect(out.length).toBeLessThan(big.length);
});

test("optimizeBuffer: 지원 밖 포맷(webp) → null", async () => {
  const webp = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).webp().toBuffer();
  expect(await optimizeBuffer(webp, { maxWidth: 1600, jpegQuality: 80 })).toBeNull();
});
