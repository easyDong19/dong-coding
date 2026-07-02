import { expect, test } from "vitest";
import { getSeriesNav } from "./selectors";
import { makePost } from "@/shared/test/factories";

const inSeries = (slug: string, order: number, extra = {}) =>
  makePost({ slug, series: "s", order, ...extra });

test("2·중간 회차: prev·next 존재, index/total", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2), inSeries("c", 3)];
  const nav = getSeriesNav("b", posts)!;
  expect(nav.prev!.slug).toBe("a");
  expect(nav.next!.slug).toBe("c");
  expect([nav.index, nav.total]).toEqual([2, 3]);
});

test("첫 회차: prev=null", () => {
  const nav = getSeriesNav("a", [inSeries("a", 1), inSeries("b", 2)])!;
  expect(nav.prev).toBeNull();
  expect(nav.next!.slug).toBe("b");
});

test("마지막 회차: next=null", () => {
  const nav = getSeriesNav("b", [inSeries("a", 1), inSeries("b", 2)])!;
  expect(nav.next).toBeNull();
});

test("1편짜리 시리즈: 양쪽 null, total=1", () => {
  const nav = getSeriesNav("a", [inSeries("a", 1)])!;
  expect([nav.prev, nav.next, nav.total]).toEqual([null, null, 1]);
});

test("시리즈 미소속 → null", () => {
  expect(getSeriesNav("x", [makePost({ slug: "x" })])).toBeNull();
});

test("order 빈틈(1,2,5): 이웃은 order 정렬, index는 정렬 위치", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2), inSeries("c", 5)];
  const nav = getSeriesNav("b", posts)!;
  expect(nav.next!.slug).toBe("c"); // 2의 다음은 5
  expect([nav.index, nav.total]).toEqual([2, 3]); // order 5가 아니라 위치 2/3
});

test("draft 회차 제외: 1,2(draft),3 → 1의 next는 3", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2, { draft: true }), inSeries("c", 3)];
  const nav = getSeriesNav("a", posts)!;
  expect(nav.next!.slug).toBe("c");
  expect(nav.total).toBe(2);
});

test("존재하지 않는 slug → null (throw 금지)", () => {
  expect(getSeriesNav("ghost", [inSeries("a", 1)])).toBeNull();
});
