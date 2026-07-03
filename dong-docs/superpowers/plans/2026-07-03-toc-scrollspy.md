# 따라다니는 목차 (TOC scrollspy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 포스트 읽기 화면 오른쪽 여백에 데스크톱 전용 sticky 목차(H2+H3)를 붙이고, IntersectionObserver로 현재 섹션을 은은하게 하이라이트한다.

**Architecture:** FSD `widgets/toc/` 위젯. DOM에 의존하지 않는 순수 함수 2개(`flattenToc`·`pickActive`)를 단위 테스트로 커버하고, 클라이언트 훅(`useActiveHeading`)은 브라우저 rect를 순수 함수에 먹이는 얇은 어댑터. `PostView`(서버)가 `post.toc`를 클라이언트 위젯에 전달. `≤1100px`에선 CSS로 숨김.

**Tech Stack:** Next.js 16(App Router, SSG) · React 19 · TypeScript · Velite `s.toc()` · CSS Modules · Vitest.

**정본 근거:** `dong-docs/design.md §4.5`·`§2.7` · `dong-docs/prepare/tech-stack.md §5.1` · 스펙 `dong-docs/superpowers/specs/2026-07-03-toc-scrollspy-design.md`.

## Global Constraints

- **커밋/PR/머지 승인 게이트:** `git commit`·PR·main 머지는 사용자가 명시적으로 지시할 때만. 각 task의 Commit 단계는 **실행 전 사용자에게 확인**한다(한 번 승인=1회). `--no-verify` 금지.
- **커밋 컨벤션:** `<type>: <제목>`. type은 `feat fix post docs style refactor chore` 중 하나. 스코프 없음. 제목 끝 마침표 없음, 72자 이내. 이 기능은 `feat`. husky `commit-msg` 훅이 형식 강제.
- **패키지 매니저 pnpm 전용.** `npm`/`yarn` 금지. 스크립트는 `pnpm <script>` / `pnpm exec <bin>`.
- **디자인 토큰만:** 5색(`--paper --ink --moss --stone --line`) + 파생 토큰만. 새 색·폰트·임의 크기 금지. 폰트는 `--text-sm` 등 스케일 토큰 사용.
- **접근성:** `<nav aria-label="목차">`, `:focus-visible` 포커스 링 유지, 애니메이션 없음.
- **빌드 게이트:** `pnpm build`는 `velite --clean --strict && next build`. 최종 통과 필수.

---

### Task 1: `flattenToc` 순수 함수

중첩 `TocEntry[]`(Velite `s.toc()` 출력)를 렌더·스크롤스파이가 쓸 평탄 배열로 변환한다. H2+H3만(그 이하 깊이는 버림).

**Files:**
- Create: `widgets/toc/lib/flatten-toc.ts`
- Test: `widgets/toc/lib/flatten-toc.test.ts`

**Interfaces:**
- Consumes: 없음(Velite `TocEntry` 구조 `{ title: string; url: string; items: TocEntry[] }`를 구조적으로 재선언).
- Produces:
  - `type TocEntry = { title: string; url: string; items: TocEntry[] }`
  - `type FlatHeading = { id: string; text: string; depth: 2 | 3 }`
  - `function flattenToc(entries: TocEntry[]): FlatHeading[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`widgets/toc/lib/flatten-toc.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec vitest run widgets/toc/lib/flatten-toc.test.ts`
Expected: FAIL — `flatten-toc` 모듈/`flattenToc` 없음.

- [ ] **Step 3: 최소 구현**

`widgets/toc/lib/flatten-toc.ts`:

```ts
export type TocEntry = { title: string; url: string; items: TocEntry[] };

export type FlatHeading = { id: string; text: string; depth: 2 | 3 };

/** Velite s.toc() 중첩 트리 → H2·H3 평탄 배열(문서 순서 보존). H4+ 는 버린다. */
export function flattenToc(entries: TocEntry[]): FlatHeading[] {
  const out: FlatHeading[] = [];
  for (const h2 of entries) {
    out.push({ id: h2.url.replace(/^#/, ""), text: h2.title, depth: 2 });
    for (const h3 of h2.items) {
      out.push({ id: h3.url.replace(/^#/, ""), text: h3.title, depth: 3 });
    }
  }
  return out;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm exec vitest run widgets/toc/lib/flatten-toc.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add widgets/toc/lib/flatten-toc.ts widgets/toc/lib/flatten-toc.test.ts
git commit -m "feat: 목차 트리 평탄화 순수 함수 flattenToc 추가"
```

---

### Task 2: `pickActive` 순수 함수

헤딩들의 화면상 top 위치와 트리거선(마스트헤드 아래)을 받아 현재 active 헤딩 id를 고른다. "트리거선 위로 지나간 마지막 헤딩" 규칙.

**Files:**
- Create: `widgets/toc/lib/pick-active.ts`
- Test: `widgets/toc/lib/pick-active.test.ts`

**Interfaces:**
- Consumes: 없음.
- Produces:
  - `type HeadingPosition = { id: string; top: number }`
  - `function pickActive(positions: HeadingPosition[], triggerLine: number): string | null`

- [ ] **Step 1: 실패하는 테스트 작성**

`widgets/toc/lib/pick-active.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec vitest run widgets/toc/lib/pick-active.test.ts`
Expected: FAIL — `pick-active` 모듈/`pickActive` 없음.

- [ ] **Step 3: 최소 구현**

`widgets/toc/lib/pick-active.ts`:

```ts
export type HeadingPosition = { id: string; top: number };

/**
 * 트리거선 위로 지나간(top <= triggerLine) 마지막 헤딩 id.
 * 아무도 안 지나갔으면 첫 헤딩(최상단), 목록이 비면 null.
 * positions 는 문서 순서라고 가정.
 */
export function pickActive(
  positions: HeadingPosition[],
  triggerLine: number,
): string | null {
  if (positions.length === 0) return null;
  let active = positions[0].id;
  for (const pos of positions) {
    if (pos.top <= triggerLine) active = pos.id;
  }
  return active;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm exec vitest run widgets/toc/lib/pick-active.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add widgets/toc/lib/pick-active.ts widgets/toc/lib/pick-active.test.ts
git commit -m "feat: active 섹션 선택 순수 함수 pickActive 추가"
```

---

### Task 3: `useActiveHeading` 클라이언트 훅

IntersectionObserver로 헤딩이 상단 트리거 밴드를 가로지를 때만 발화 → 콜백에서 rect를 읽어 `pickActive`로 active id 계산. 스크롤 이벤트 리스너·폴링 없음.

**Files:**
- Create: `widgets/toc/model/use-active-heading.ts`

**Interfaces:**
- Consumes: `FlatHeading`(Task 1), `pickActive`·`HeadingPosition`(Task 2).
- Produces: `function useActiveHeading(headings: FlatHeading[]): string | null`

> 이 파일은 브라우저 IntersectionObserver·DOM에 의존한다. jsdom 한계로 단위 테스트는 두지 않는다(로직은 Task 1·2 순수 함수가 이미 커버). 검증은 Task 5의 빌드+수동 확인.

- [ ] **Step 1: 구현 작성**

`widgets/toc/model/use-active-heading.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import type { FlatHeading } from "../lib/flatten-toc";
import { pickActive, type HeadingPosition } from "../lib/pick-active";

/** 현재 읽는 섹션의 헤딩 id. 헤딩이 없거나 아직 미확정이면 null. */
export function useActiveHeading(headings: FlatHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // 트리거선 = 마스트헤드 높이(--masthead-h rem → px) + 8px 여유
    const rootStyles = getComputedStyle(document.documentElement);
    const rootFont = parseFloat(rootStyles.fontSize) || 16;
    const mastheadRem = parseFloat(rootStyles.getPropertyValue("--masthead-h")) || 3;
    const triggerLine = mastheadRem * rootFont + 8;

    const compute = () => {
      const positions: HeadingPosition[] = els.map((el) => ({
        id: el.id,
        top: el.getBoundingClientRect().top,
      }));
      setActiveId(pickActive(positions, triggerLine));
    };

    const observer = new IntersectionObserver(compute, {
      rootMargin: `-${triggerLine}px 0px -65% 0px`,
      threshold: 0,
    });
    els.forEach((el) => observer.observe(el));
    compute(); // 초기 1회(첫 페인트 직후 현재 위치 반영)

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
```

> **주의:** `headings` 인자는 호출부(Task 4)에서 `useMemo`로 안정화해야 effect가 매 렌더 재실행되지 않는다.

- [ ] **Step 2: 타입체크 확인**

Run: `pnpm typecheck`
Expected: PASS(에러 없음). 실패 시 import 경로/타입 수정.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add widgets/toc/model/use-active-heading.ts
git commit -m "feat: 스크롤스파이 훅 useActiveHeading 추가"
```

---

### Task 4: `Toc` 컴포넌트 + 스타일 + public API

평탄 헤딩을 무불릿 `ol`로 렌더하고 active 상태를 §4.5 스펙대로 스타일링. 헤딩 0개면 `null` 반환(빈 박스 금지).

**Files:**
- Create: `widgets/toc/Toc.tsx`
- Create: `widgets/toc/Toc.module.css`
- Create: `widgets/toc/index.ts`

**Interfaces:**
- Consumes: `flattenToc`·`TocEntry`(Task 1), `useActiveHeading`(Task 3), `Eyebrow` (`@/shared/ui`).
- Produces: `Toc` 컴포넌트 — props `{ toc: TocEntry[] }`. `export { Toc } from "./Toc"` (index.ts).

- [ ] **Step 1: 컴포넌트 작성**

`widgets/toc/Toc.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { Eyebrow } from "@/shared/ui";
import { flattenToc, type TocEntry } from "./lib/flatten-toc";
import { useActiveHeading } from "./model/use-active-heading";
import styles from "./Toc.module.css";

export function Toc({ toc }: { toc: TocEntry[] }) {
  const headings = useMemo(() => flattenToc(toc), [toc]);
  const activeId = useActiveHeading(headings);

  if (headings.length === 0) return null;

  return (
    <nav className={styles.toc} aria-label="목차">
      <Eyebrow>목차</Eyebrow>
      <ol className={styles.list}>
        {headings.map((h) => (
          <li
            key={h.id}
            className={h.depth === 3 ? styles.sub : undefined}
            data-active={h.id === activeId || undefined}
          >
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: 스타일 작성**

`widgets/toc/Toc.module.css`:

```css
/* 따라다니는 목차 (design.md §4.5) — 은은한 보조, 애니메이션 없음 */
.toc {
  position: sticky;
  top: calc(var(--masthead-h) + 1.5rem);
  max-height: calc(100vh - var(--masthead-h) - 3rem);
  overflow-y: auto;
  font-size: var(--text-sm);
}
.list {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  border-left: 1px solid var(--line);
}
.list li {
  margin: 0;
}
.list a {
  display: block;
  padding: 0.25rem 0 0.25rem 0.9rem;
  margin-left: -1px;
  border-left: 1px solid transparent;
  color: var(--stone);
  line-height: 1.5;
  text-decoration: none;
}
.list a:hover {
  color: var(--ink);
}
.list li[data-active] a {
  color: var(--moss);
  border-left-color: var(--moss);
}
.sub a {
  padding-left: 1.8rem;
}
.list a:focus-visible {
  outline: 2px solid var(--moss);
  outline-offset: 2px;
}
```

- [ ] **Step 3: public API 작성**

`widgets/toc/index.ts`:

```ts
export { Toc } from "./Toc";
```

- [ ] **Step 4: 타입체크 확인**

Run: `pnpm typecheck`
Expected: PASS. (`Eyebrow` children 타입·`TocEntry` import 확인.)

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add widgets/toc/Toc.tsx widgets/toc/Toc.module.css widgets/toc/index.ts
git commit -m "feat: 목차 컴포넌트 Toc 추가"
```

---

### Task 5: `PostView` 배선 + 반응형 숨김 + 빌드 검증

읽기 레이아웃 오른쪽 여백(그리드 col 3)에 목차를 얹고, `≤1100px`에서 숨긴다. 전체 빌드·테스트 게이트를 통과시키고 실제 화면을 눈으로 확인한다.

**Files:**
- Modify: `views/post-page/PostView.tsx`
- Modify: `views/post-page/PostView.module.css`

**Interfaces:**
- Consumes: `Toc` (`@/widgets/toc`, Task 4), `post.toc: TocEntry[]`(Velite Post 타입).
- Produces: 없음(최종 통합).

- [ ] **Step 1: `PostView.tsx`에 목차 배선**

`views/post-page/PostView.tsx` — 상단 import에 추가:

```tsx
import { Toc } from "@/widgets/toc";
```

그리고 `<article>…</article>` 닫힌 **바로 다음**, `</div>`(layout) 닫히기 **전**에 `<aside>` 추가:

```tsx
        <SeriesNav nav={nav} seriesTitle={seriesTitle} />
        <Related posts={related} />
      </article>
      <aside className={styles.tocCol}>
        <Toc toc={post.toc} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: `PostView.module.css`에 목차 컬럼 + 반응형 숨김 추가**

`views/post-page/PostView.module.css` — 파일 끝에 추가:

```css
/* 따라다니는 목차 컬럼 — 오른쪽 여백(col 3), ≤1100px 숨김 (design.md §4.5·§2.7) */
.tocCol {
  grid-column: 3;
  min-width: 0;
}
@media (max-width: 1100px) {
  .tocCol {
    display: none;
  }
}
```

- [ ] **Step 3: 타입체크 + 전체 테스트**

Run: `pnpm typecheck && pnpm test`
Expected: typecheck PASS, vitest 전체 PASS(기존 49 + 신규 9 = 58 tests).

- [ ] **Step 4: 프로덕션 빌드 게이트**

Run: `pnpm build`
Expected: `velite --clean --strict` 통과 + `next build` 성공(에러 0). 실패 시 로그 보고 후 수정.

- [ ] **Step 5: 실제 화면 수동 확인**

Run: `pnpm dev` 후 헤딩 2개 이상인 포스트 상세를 연다(필요하면 임시로 `content/posts/*.mdx`에 H2/H3 몇 개 추가해 확인 후 되돌린다).
확인 항목:
- 데스크톱(≥1100px): 오른쪽 여백에 목차 노출, eyebrow "목차", H3 들여쓰기.
- 스크롤 시 현재 섹션이 moss + 좌측 라인 moss로 하이라이트, 마스트헤드에 안 가림.
- 목차 링크 클릭 시 해당 헤딩으로 이동(앵커), 헤딩이 마스트헤드 아래에 위치.
- 창을 1100px 이하로 줄이면 목차 사라지고 본문 폭·가로 스크롤 정상(320px까지 가로 스크롤 0).
- 헤딩 0개 포스트에서 목차/빈 박스 안 뜸.

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add views/post-page/PostView.tsx views/post-page/PostView.module.css
git commit -m "feat: 읽기 화면에 따라다니는 목차 배선"
```

---

## 완료 기준 (Definition of Done)

- `flattenToc`·`pickActive` 단위 테스트 전부 통과, 기존 테스트 무회귀.
- `pnpm typecheck`·`pnpm build`(`--strict`) 통과.
- 데스크톱에서 목차 노출·스크롤스파이 동작, `≤1100px` 숨김, 320px 가로 스크롤 0.
- 새 색·폰트·임의 크기 도입 0, `<nav aria-label="목차">`·포커스 링 유지.
- (사용자 승인 시) 브랜치 `feat/toc-scrollspy` → PR(커밋 컨벤션 제목) → squash merge.
