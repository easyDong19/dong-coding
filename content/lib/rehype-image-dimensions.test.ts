import { expect, test } from "vitest";
import sharp from "sharp";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import rehypeImageDimensions from "./rehype-image-dimensions";

async function fixtureImage(w: number, h: number) {
  const dir = await mkdtemp(join(tmpdir(), "img-"));
  const path = join(dir, "pic.png");
  const buf = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).png().toBuffer();
  await writeFile(path, buf);
  return path;
}

function imgNode(src: string) {
  return { type: "element", tagName: "img", properties: { src }, children: [] };
}

test("로컬 img에 원본 width/height 주입", async () => {
  const path = await fixtureImage(640, 480);
  const node = imgNode("/static/pic-abc123.png?x#y");
  const tree = { type: "root", children: [node] };
  await rehypeImageDimensions({ resolve: () => path })(tree as never);
  expect(node.properties.width).toBe(640);
  expect(node.properties.height).toBe(480);
});

test("원격 URL은 건드리지 않음", async () => {
  const node = imgNode("https://x.com/a.png");
  const tree = { type: "root", children: [node] };
  await rehypeImageDimensions({ resolve: () => "/should/not/be/used" })(tree as never);
  expect(node.properties.width).toBeUndefined();
});

test("resolve가 못 찾으면 치수 없이 통과", async () => {
  const node = imgNode("/static/missing.png");
  const tree = { type: "root", children: [node] };
  await rehypeImageDimensions({ resolve: () => undefined })(tree as never);
  expect(node.properties.width).toBeUndefined();
});
