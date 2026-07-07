import { describe, it, expect } from "vitest";
import { clampTitle } from "./text";

describe("clampTitle", () => {
  it("짧은 제목은 그대로 둔다", () => {
    expect(clampTitle("Claude Code 설치와 첫 실행")).toBe("Claude Code 설치와 첫 실행");
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(clampTitle("  제목  ")).toBe("제목");
  });

  it("max를 넘으면 말줄임(…)으로 자른다", () => {
    const long = "가".repeat(60);
    const out = clampTitle(long);
    expect(out.length).toBe(42); // 41자 + …
    expect(out.endsWith("…")).toBe(true);
  });

  it("경계값(정확히 max)은 자르지 않는다", () => {
    const exact = "나".repeat(42);
    expect(clampTitle(exact)).toBe(exact);
  });
});
