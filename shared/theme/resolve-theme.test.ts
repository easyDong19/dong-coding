import { expect, test } from "vitest";
import { resolveTheme } from "./resolve-theme";

test("저장값 있으면 OS 무시하고 저장값 우선", () => {
  expect(resolveTheme("dark", "light")).toBe("dark");
});
test("저장값 없으면 OS 따름", () => {
  expect(resolveTheme(null, "dark")).toBe("dark");
});
test("깨진 저장값 → OS 폴백", () => {
  expect(resolveTheme("banana", "light")).toBe("light");
});
test("둘 다 없음 → system(브라우저 위임)", () => {
  expect(resolveTheme(null, null)).toBe("system");
});
