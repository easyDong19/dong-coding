import { expect, test } from "vitest";
import { getPublishedPosts } from "./selectors";
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
