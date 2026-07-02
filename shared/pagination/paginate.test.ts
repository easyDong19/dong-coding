import { expect, test } from "vitest";
import { paginate } from "./paginate";

const arr = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

test("25편 page2 size10 → 11~20, totalPages 3", () => {
  const r = paginate(arr(25), 2, 10);
  expect(r.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  expect(r.totalPages).toBe(3);
});
test("정확히 10편(경계) → totalPages 1", () => {
  expect(paginate(arr(10), 1, 10).totalPages).toBe(1);
});
test("11편(경계+1) → totalPages 2, 2페이지 1편", () => {
  const r = paginate(arr(11), 2, 10);
  expect(r.totalPages).toBe(2);
  expect(r.items).toEqual([11]);
});
test("0편 → totalPages 1, page1 정상, page2 outOfRange", () => {
  expect(paginate(arr(0), 1, 10)).toMatchObject({ items: [], totalPages: 1, outOfRange: false });
  expect(paginate(arr(0), 2, 10).outOfRange).toBe(true);
});
test("범위 밖 page 999 → outOfRange", () => {
  expect(paginate(arr(25), 999, 10).outOfRange).toBe(true);
});
test("page 0·음수·비정수 → outOfRange", () => {
  expect(paginate(arr(25), 0, 10).outOfRange).toBe(true);
  expect(paginate(arr(25), -1, 10).outOfRange).toBe(true);
  expect(paginate(arr(25), 1.5, 10).outOfRange).toBe(true);
});
