import { expect, test } from "vitest";
import { toFeedItems } from "./feed-items";
import { makePost } from "@/shared/test/factories";

const SITE = "https://dongcoding.dev";

test("§5.1-1: description 있으면 그대로 매핑", () => {
  const [item] = toFeedItems([makePost({ slug: "a", description: "요약", excerpt: "발췌" })], SITE);
  expect(item.description).toBe("요약");
});
test("§5.1-2: description 없으면 excerpt 폴백", () => {
  const [item] = toFeedItems([makePost({ slug: "a", excerpt: "발췌" })], SITE);
  expect(item.description).toBe("발췌");
});
test("§5.1-4: link = slug 절대 URL (guid로도 사용)", () => {
  const [item] = toFeedItems([makePost({ slug: "hello" })], SITE);
  expect(item.link).toBe("https://dongcoding.dev/posts/hello");
});
test("title·date 매핑 + 입력 순서 보존", () => {
  const items = toFeedItems(
    [makePost({ slug: "a", title: "가", date: "2026-01-02" }), makePost({ slug: "b", title: "나", date: "2026-01-01" })],
    SITE,
  );
  expect(items.map((i) => [i.title, i.date])).toEqual([["가", "2026-01-02"], ["나", "2026-01-01"]]);
});
