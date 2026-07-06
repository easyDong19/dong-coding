import { expect, test } from "vitest";
import { collectOversized } from "./images.mjs";

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
