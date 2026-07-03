import { describe, expect, it } from "vitest";
import { flattenToc } from "./flatten-toc";

describe("flattenToc", () => {
  it("빈 목차는 빈 배열", () => {
    expect(flattenToc([])).toEqual([]);
  });

  it("url의 # 을 제거해 id로 쓰고 depth 2를 매긴다", () => {
    const result = flattenToc([{ title: "시작하기", url: "#시작하기", items: [] }]);
    expect(result).toEqual([{ id: "시작하기", text: "시작하기", depth: 2 }]);
  });

  it("H3를 부모 H2 뒤에 문서 순서로 이어붙이고 depth 3을 매긴다", () => {
    const result = flattenToc([
      {
        title: "설치",
        url: "#설치",
        items: [
          { title: "macOS", url: "#macos", items: [] },
          { title: "Windows", url: "#windows", items: [] },
        ],
      },
      { title: "사용법", url: "#사용법", items: [] },
    ]);
    expect(result).toEqual([
      { id: "설치", text: "설치", depth: 2 },
      { id: "macos", text: "macOS", depth: 3 },
      { id: "windows", text: "Windows", depth: 3 },
      { id: "사용법", text: "사용법", depth: 2 },
    ]);
  });

  it("H3보다 깊은 헤딩(H4)은 버린다", () => {
    const result = flattenToc([
      {
        title: "A",
        url: "#a",
        items: [{ title: "B", url: "#b", items: [{ title: "C", url: "#c", items: [] }] }],
      },
    ]);
    expect(result).toEqual([
      { id: "a", text: "A", depth: 2 },
      { id: "b", text: "B", depth: 3 },
    ]);
  });
});
