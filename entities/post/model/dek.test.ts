import { expect, test } from "vitest";
import { pickDek } from "./dek";

test("§5.1-1: description 있으면 그대로 사용", () => {
  expect(pickDek({ description: "요약", excerpt: "본문발췌" })).toBe("요약");
});
test("§5.1-2: description 없으면 excerpt 폴백", () => {
  expect(pickDek({ excerpt: "본문발췌" })).toBe("본문발췌");
});
test("둘 다 없으면 undefined", () => {
  expect(pickDek({})).toBeUndefined();
});
