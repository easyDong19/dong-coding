import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("조건부 클래스를 결합한다", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("뒤에 온 유틸리티가 충돌을 이긴다", () => {
    expect(cn("text-stone", "text-ink")).toBe("text-ink");
  });
});
