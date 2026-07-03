import { describe, expect, it } from "vitest";
import { pickActive } from "./pick-active";

describe("pickActive", () => {
  it("빈 목록이면 null", () => {
    expect(pickActive([], 56)).toBeNull();
  });

  it("모든 헤딩이 트리거선 아래면(아직 안 지나감) 첫 헤딩", () => {
    const positions = [
      { id: "a", top: 200 },
      { id: "b", top: 500 },
    ];
    expect(pickActive(positions, 56)).toBe("a");
  });

  it("트리거선 위로 지나간 마지막 헤딩을 고른다", () => {
    const positions = [
      { id: "a", top: -300 },
      { id: "b", top: 40 },
      { id: "c", top: 700 },
    ];
    expect(pickActive(positions, 56)).toBe("b");
  });

  it("top === triggerLine 은 지나간 것으로 본다", () => {
    const positions = [
      { id: "a", top: 56 },
      { id: "b", top: 800 },
    ];
    expect(pickActive(positions, 56)).toBe("a");
  });

  it("마지막 헤딩까지 다 지나가면 마지막", () => {
    const positions = [
      { id: "a", top: -900 },
      { id: "b", top: -400 },
      { id: "c", top: -50 },
    ];
    expect(pickActive(positions, 56)).toBe("c");
  });
});
