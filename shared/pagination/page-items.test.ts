import { expect, test } from "vitest";
import { getPageItems } from "./page-items";

test("total 적음(3) → 전부", () => {
  expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
});
test("앞쪽(1/10) → 1 2 3 … 10", () => {
  expect(getPageItems(1, 10)).toEqual([1, 2, 3, "…", 10]);
});
test("중간(5/10) → 1 … 4 5 6 … 10", () => {
  expect(getPageItems(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
});
test("끝(10/10) → 1 … 8 9 10", () => {
  expect(getPageItems(10, 10)).toEqual([1, "…", 8, 9, 10]);
});
test("생략이 1페이지만 가리면 숫자로 대체(…아님)", () => {
  // 예: current 3, total 5 → 1 2 3 4 5 (… 없이)
  expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
});
test("total 1 → [1] (호출부에서 미표시 판정)", () => {
  expect(getPageItems(1, 1)).toEqual([1]);
});
