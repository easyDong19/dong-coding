import { expect, test } from "vitest";
import { resolveImageProps } from "./post-image-props";

test("치수 있는 로컬 → next", () => {
  expect(resolveImageProps({ src: "/static/a.png", alt: "x", width: "640", height: "480" })).toEqual({
    kind: "next", src: "/static/a.png", alt: "x", width: 640, height: 480,
  });
});

test("치수 없음 → img 폴백", () => {
  expect(resolveImageProps({ src: "/static/a.png", alt: "x" })).toEqual({
    kind: "img", src: "/static/a.png", alt: "x",
  });
});

test("원격 URL은 치수 있어도 img 폴백", () => {
  expect(resolveImageProps({ src: "https://x/a.png", width: 640, height: 480 })).toEqual({
    kind: "img", src: "https://x/a.png", alt: "",
  });
});

test("src 없음 → null", () => {
  expect(resolveImageProps({})).toBeNull();
});
