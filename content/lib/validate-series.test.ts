import { expect, test } from "vitest";
import { validateSeriesIntegrity } from "./validate-series";

const S = (slug: string) => ({ slug });
const P = (
  o: Partial<{ slug: string; series: string; order: number; draft: boolean }>,
) => ({ slug: "p", ...o });

test("1: 없는 시리즈 참조 → throw (빌드 중단)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [P({ slug: "a", series: "ghost", order: 1 })],
      series: [],
    }),
  ).toThrow(/ghost/);
});

test("2: 같은 시리즈 중복 order → throw", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [
        P({ slug: "a", series: "s", order: 1 }),
        P({ slug: "b", series: "s", order: 1 }),
      ],
      series: [S("s")],
    }),
  ).toThrow(/중복/);
});

test("3: order 빈틈(1,3) → throw 하지 않음(경고만)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [
        P({ slug: "a", series: "s", order: 1 }),
        P({ slug: "b", series: "s", order: 3 }),
      ],
      series: [S("s")],
    }),
  ).not.toThrow();
});

test("5: 정상 데이터 → 통과", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [
        P({ slug: "a", series: "s", order: 1 }),
        P({ slug: "b", series: "s", order: 2 }),
      ],
      series: [S("s")],
    }),
  ).not.toThrow();
});

test("6: draft 글의 잘못된 참조 → throw 하지 않음(검증 제외)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [P({ slug: "a", series: "ghost", order: 1, draft: true })],
      series: [],
    }),
  ).not.toThrow();
});

test("6b: draft가 중복 order를 유발해도 무시(발행 글만 검증)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [
        P({ slug: "a", series: "s", order: 1 }),
        P({ slug: "b", series: "s", order: 1, draft: true }),
      ],
      series: [S("s")],
    }),
  ).not.toThrow();
});
