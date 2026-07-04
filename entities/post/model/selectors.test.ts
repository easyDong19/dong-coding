import { expect, test } from "vitest";
import { getPublishedPosts, getRelatedPosts, rankToPosts } from "./selectors";
import { makePost } from "@/shared/test/factories";

test("날짜 내림차순", () => {
  const r = getPublishedPosts([
    makePost({ slug: "a", date: "2026-01-01" }),
    makePost({ slug: "b", date: "2026-03-01" }),
  ]);
  expect(r.map((p) => p.slug)).toEqual(["b", "a"]);
});

test("draft 제외", () => {
  const r = getPublishedPosts([
    makePost({ slug: "a" }),
    makePost({ slug: "b", draft: true }),
  ]);
  expect(r.map((p) => p.slug)).toEqual(["a"]);
});

test("같은 날짜 → slug 사전순 tie-break (결정적)", () => {
  const r = getPublishedPosts([
    makePost({ slug: "banana", date: "2026-01-01" }),
    makePost({ slug: "apple", date: "2026-01-01" }),
  ]);
  expect(r.map((p) => p.slug)).toEqual(["apple", "banana"]);
});

test("미래 날짜 글도 노출", () => {
  const r = getPublishedPosts([makePost({ slug: "future", date: "2099-01-01" })]);
  expect(r).toHaveLength(1);
});

const tagged = (slug: string, tags: string[], extra = {}) => makePost({ slug, tags, ...extra });

test("겹치는 태그 수 내림차순", () => {
  const target = tagged("t", ["a", "b"]);
  const posts = [target, tagged("x", ["a"]), tagged("y", ["a", "b"])];
  expect(getRelatedPosts(target, posts).map((p) => p.slug)).toEqual(["y", "x"]);
});
test("자기 자신 제외", () => {
  const target = tagged("t", ["a"]);
  expect(getRelatedPosts(target, [target]).map((p) => p.slug)).toEqual([]);
});
test("매칭 0편 → []", () => {
  const target = tagged("t", ["a"]);
  expect(getRelatedPosts(target, [target, tagged("x", ["z"])])).toEqual([]);
});
test("대상 글 태그 없음 → []", () => {
  const target = makePost({ slug: "t", tags: [] });
  expect(getRelatedPosts(target, [target, tagged("x", ["a"])])).toEqual([]);
});
test("같은 시리즈 글도 태그 겹치면 포함(제외 안 함)", () => {
  const target = tagged("t", ["a"], { series: "s", order: 1 });
  const sibling = tagged("u", ["a"], { series: "s", order: 2 });
  expect(getRelatedPosts(target, [target, sibling]).map((p) => p.slug)).toEqual(["u"]);
});

const pub = [
  makePost({ slug: "a", date: "2026-01-03" }),
  makePost({ slug: "b", date: "2026-01-02" }),
  makePost({ slug: "c", date: "2026-01-01" }),
];

test("§3.2-1: 정상 top-N → Redis 순서 유지 + 메타 병합", () => {
  const r = rankToPosts(["c", "a", "b"], pub);
  expect(r.map((p) => p.slug)).toEqual(["c", "a", "b"]); // 날짜순 아님 — Redis 순서
});
test("§3.2-2: 삭제된 글 slug 포함 → 필터 후 반환", () => {
  const r = rankToPosts(["a", "ghost", "b"], pub);
  expect(r.map((p) => p.slug)).toEqual(["a", "b"]);
});
test("§3.2-3: 삭제 필터 후 N 미달 → 모자란 대로 반환(채우지 않음)", () => {
  const r = rankToPosts(["a", "x", "y", "z", "b"], pub);
  expect(r.map((p) => p.slug)).toEqual(["a", "b"]);
});
test("§3.2-4: Redis 빈 배열 → [] (섹션 생략 판정)", () => {
  expect(rankToPosts([], pub)).toEqual([]);
});
test("§3.2-5: draft/비공개 slug는 교집합에서 자연 배제", () => {
  const publishedOnly = pub; // 호출부가 getPublishedPosts 결과를 넘김
  const r = rankToPosts(["a", "draftpost", "b"], publishedOnly);
  expect(r.map((p) => p.slug)).toEqual(["a", "b"]);
});
