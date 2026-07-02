# Phase 2 — 엔티티 셀렉터 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `test-plan.md`의 순수 함수 전부(시리즈 네비·목록 그룹핑·페이지네이션·글 정렬·관련 글)를 TDD로 구현한다. 이 페이즈가 **테스트 전략의 심장** — 모든 화면의 상류 데이터가 여기서 결정적으로 계산된다.

**Architecture:** 모든 함수는 `posts: PostLike[]`(또는 `series`)를 인자로 받는 **순수 함수**(`00-roadmap.md §2`). `entities/{post,series}/model/selectors.ts`에 구현하고 `entities/*/index.ts`(public API)로 재노출. `.velite` 로드는 여기서 하지 않는다(진입 파일 몫). 픽스처는 `shared/test/factories.ts`.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

`00-roadmap.md §2` 적용. 특히:
- 정렬 `date desc → slug asc`(결정적), 미래 날짜 노출.
- draft 제외는 `getPublishedPosts`에서 한 번 — 하류(시리즈·페이지네이션·관련 글)는 이미 필터된 목록을 받거나 자체 필터를 명시.
- 셀렉터는 시리즈 여부로 분기하지 않는 등 **순수·목 불필요** 유지.

---

### Task 2.1: `getPublishedPosts` — 정렬·필터 (TDD, test-plan §3.1)

**Files:**
- Create: `entities/post/model/selectors.ts`, `entities/post/model/selectors.test.ts`
- Modify: `entities/post/index.ts`

**Interfaces:**
- Produces: `getPublishedPosts(posts: PostLike[]): PostLike[]` — draft 제외, `date desc → slug asc`. **모든 목록의 상류.**
- Consumes: `PostLike`(`shared/test/factories.ts`).

- [ ] **Step 1: 실패 테스트 (§3.1 케이스 1~4)**

```ts
// entities/post/model/selectors.test.ts
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
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/post` → FAIL(`getPublishedPosts` 미정의).

- [ ] **Step 3: 구현**

```ts
// entities/post/model/selectors.ts
import type { PostLike } from "@/shared/test/factories";

export function getPublishedPosts(posts: PostLike[]): PostLike[] {
  return posts
    .filter((p) => !p.draft)
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? a.slug.localeCompare(b.slug)      // tie-break: slug asc
        : a.date < b.date ? 1 : -1,          // date desc
    );
}
```
> 실 코드에서 `PostLike`는 Velite `Post` 타입으로 대체(Phase 1 생성). 지금은 픽스처 타입으로 계약을 고정하고, 진입 파일에서 구조적 호환으로 연결.

- [ ] **Step 4: 통과 확인** — Run: `pnpm test entities/post` → 4 passed.

- [ ] **Step 5: public API 재노출 + 커밋**

```ts
// entities/post/index.ts
export { getPublishedPosts } from "./model/selectors";
```
```bash
git add -A && git commit -m "feat: getPublishedPosts with deterministic date/slug sort"
```

---

### Task 2.2: `getSeriesNav` — 이전/다음 (TDD, test-plan §1.1)

**Files:**
- Create: `entities/series/model/selectors.ts`, `entities/series/model/selectors.test.ts`
- Modify: `entities/series/index.ts`

**Interfaces:**
- Produces: `getSeriesNav(postSlug: string, posts: PostLike[]): SeriesNav | null`
  - `type SeriesNav = { series: string; index: number; total: number; prev: PostLike | null; next: PostLike | null }`
  - `index`·`total`은 **정렬 배열 위치 기준**(order 값 아님). `prev/next`는 order 정렬 이웃. draft 회차 제외. 시리즈 미소속이면 `null`.
- Consumes: `PostLike`.

- [ ] **Step 1: 실패 테스트 (§1.1 케이스 1~8)**

```ts
// entities/series/model/selectors.test.ts
import { expect, test } from "vitest";
import { getSeriesNav } from "./selectors";
import { makePost } from "@/shared/test/factories";

const inSeries = (slug: string, order: number, extra = {}) =>
  makePost({ slug, series: "s", order, ...extra });

test("2·중간 회차: prev·next 존재, index/total", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2), inSeries("c", 3)];
  const nav = getSeriesNav("b", posts)!;
  expect(nav.prev!.slug).toBe("a");
  expect(nav.next!.slug).toBe("c");
  expect([nav.index, nav.total]).toEqual([2, 3]);
});

test("첫 회차: prev=null", () => {
  const nav = getSeriesNav("a", [inSeries("a", 1), inSeries("b", 2)])!;
  expect(nav.prev).toBeNull();
  expect(nav.next!.slug).toBe("b");
});

test("마지막 회차: next=null", () => {
  const nav = getSeriesNav("b", [inSeries("a", 1), inSeries("b", 2)])!;
  expect(nav.next).toBeNull();
});

test("1편짜리 시리즈: 양쪽 null, total=1", () => {
  const nav = getSeriesNav("a", [inSeries("a", 1)])!;
  expect([nav.prev, nav.next, nav.total]).toEqual([null, null, 1]);
});

test("시리즈 미소속 → null", () => {
  expect(getSeriesNav("x", [makePost({ slug: "x" })])).toBeNull();
});

test("order 빈틈(1,2,5): 이웃은 order 정렬, index는 정렬 위치", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2), inSeries("c", 5)];
  const nav = getSeriesNav("b", posts)!;
  expect(nav.next!.slug).toBe("c");        // 2의 다음은 5
  expect([nav.index, nav.total]).toEqual([2, 3]); // order 5가 아니라 위치 2/3
});

test("draft 회차 제외: 1,2(draft),3 → 1의 next는 3", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2, { draft: true }), inSeries("c", 3)];
  const nav = getSeriesNav("a", posts)!;
  expect(nav.next!.slug).toBe("c");
  expect(nav.total).toBe(2);
});

test("존재하지 않는 slug → null (throw 금지)", () => {
  expect(getSeriesNav("ghost", [inSeries("a", 1)])).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/series` → FAIL.

- [ ] **Step 3: 구현**

```ts
// entities/series/model/selectors.ts
import type { PostLike } from "@/shared/test/factories";

export type SeriesNav = {
  series: string; index: number; total: number;
  prev: PostLike | null; next: PostLike | null;
};

export function getSeriesNav(postSlug: string, posts: PostLike[]): SeriesNav | null {
  const target = posts.find((p) => p.slug === postSlug);
  if (!target || !target.series || target.draft) return null;

  const ordered = posts
    .filter((p) => !p.draft && p.series === target.series && p.order !== undefined)
    .sort((a, b) => a.order! - b.order!);

  const i = ordered.findIndex((p) => p.slug === postSlug);
  if (i === -1) return null;

  return {
    series: target.series,
    index: i + 1,          // 정렬 위치 (order 값 아님)
    total: ordered.length,
    prev: i > 0 ? ordered[i - 1] : null,
    next: i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}
```

- [ ] **Step 4: 통과 확인** — Run: `pnpm test entities/series` → 8 passed.

- [ ] **Step 5: public API + 커밋**

```ts
// entities/series/index.ts
export { getSeriesNav } from "./model/selectors";
export type { SeriesNav } from "./model/selectors";
```
```bash
git add -A && git commit -m "feat: getSeriesNav (index=position, order-sorted neighbors)"
```

---

### Task 2.3: `getPostsInSeries` — order 오름차순 (TDD, test-plan §1.2)

**Files:**
- Modify: `entities/series/model/selectors.ts`, `entities/series/model/selectors.test.ts`, `entities/series/index.ts`

**Interfaces:**
- Produces: `getPostsInSeries(seriesSlug: string, posts: PostLike[]): PostLike[]` — order asc, draft 제외, 입력 순서 무관, 없는 slug/0편이면 `[]`.

- [ ] **Step 1: 실패 테스트 (§1.2 케이스 1~4)**

```ts
import { getPostsInSeries } from "./selectors";

test("order 3,1,2 입력 → 1,2,3 정렬(입력 순서 무관)", () => {
  const posts = [inSeries("c", 3), inSeries("a", 1), inSeries("b", 2)];
  expect(getPostsInSeries("s", posts).map((p) => p.order)).toEqual([1, 2, 3]);
});
test("draft 제외", () => {
  const posts = [inSeries("a", 1), inSeries("b", 2, { draft: true })];
  expect(getPostsInSeries("s", posts).map((p) => p.slug)).toEqual(["a"]);
});
test("발행 글 0편 → []", () => {
  expect(getPostsInSeries("s", [inSeries("a", 1, { draft: true })])).toEqual([]);
});
test("없는 slug → []", () => {
  expect(getPostsInSeries("ghost", [inSeries("a", 1)])).toEqual([]);
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/series` → 새 4개 FAIL.

- [ ] **Step 3: 구현 (같은 파일에 추가)**

```ts
export function getPostsInSeries(seriesSlug: string, posts: PostLike[]): PostLike[] {
  return posts
    .filter((p) => !p.draft && p.series === seriesSlug && p.order !== undefined)
    .sort((a, b) => a.order! - b.order!);
}
```

- [ ] **Step 4: 통과 확인 + public API + 커밋**

```ts
// entities/series/index.ts 에 추가
export { getPostsInSeries } from "./model/selectors";
```
```bash
git add -A && git commit -m "feat: getPostsInSeries ordered by order asc, draft excluded"
```

---

### Task 2.4: 시리즈 목록 그룹핑·정렬 (TDD, test-plan §1.3)

**Files:**
- Modify: `entities/series/model/selectors.ts`, `entities/series/model/selectors.test.ts`, `entities/series/index.ts`

**Interfaces:**
- Produces: `groupSeriesForList(series: SeriesLike[], posts: PostLike[]): { ongoing: SeriesCard[]; complete: SeriesCard[] }`
  - `type SeriesCard = { slug: string; title: string; description: string; count: number; lastUpdated: string; complete: boolean }`
  - 발행 글 0편 시리즈 제외. 그룹 내 **최신 활동순**(시리즈 내 최신 글 date desc). `count`는 draft 제외 수.
- Consumes: `SeriesLike`(factories), `getPostsInSeries`.

- [ ] **Step 1: 실패 테스트 (§1.3 케이스 1~5)**

```ts
import { groupSeriesForList } from "./selectors";
import { makeSeries } from "@/shared/test/factories";

test("complete 혼재 → 진행/완결 분리", () => {
  const series = [makeSeries({ slug: "s1" }), makeSeries({ slug: "s2", complete: true })];
  const posts = [makePost({ slug: "a", series: "s1", order: 1 }),
                 makePost({ slug: "b", series: "s2", order: 1 })];
  const g = groupSeriesForList(series, posts);
  expect(g.ongoing.map((s) => s.slug)).toEqual(["s1"]);
  expect(g.complete.map((s) => s.slug)).toEqual(["s2"]);
});

test("그룹 내 최신 활동순 정렬", () => {
  const series = [makeSeries({ slug: "old" }), makeSeries({ slug: "new" })];
  const posts = [
    makePost({ slug: "a", series: "old", order: 1, date: "2026-01-01" }),
    makePost({ slug: "b", series: "new", order: 1, date: "2026-05-01" }),
  ];
  expect(groupSeriesForList(series, posts).ongoing.map((s) => s.slug)).toEqual(["new", "old"]);
});

test("발행 글 0편 시리즈 숨김", () => {
  const series = [makeSeries({ slug: "empty" })];
  const posts = [makePost({ slug: "a", series: "empty", order: 1, draft: true })];
  expect(groupSeriesForList(series, posts).ongoing).toEqual([]);
});

test("완결 시리즈 0개 → complete 그룹 []", () => {
  const series = [makeSeries({ slug: "s1" })];
  const posts = [makePost({ slug: "a", series: "s1", order: 1 })];
  expect(groupSeriesForList(series, posts).complete).toEqual([]);
});

test("N편 카운트는 draft 제외", () => {
  const series = [makeSeries({ slug: "s1" })];
  const posts = [
    makePost({ slug: "a", series: "s1", order: 1 }),
    makePost({ slug: "b", series: "s1", order: 2, draft: true }),
  ];
  expect(groupSeriesForList(series, posts).ongoing[0].count).toBe(1);
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/series` → 새 5개 FAIL.

- [ ] **Step 3: 구현**

```ts
import type { SeriesLike } from "@/shared/test/factories";

export type SeriesCard = {
  slug: string; title: string; description: string;
  count: number; lastUpdated: string; complete: boolean;
};

export function groupSeriesForList(
  series: SeriesLike[], posts: PostLike[],
): { ongoing: SeriesCard[]; complete: SeriesCard[] } {
  const cards: SeriesCard[] = series
    .map((s) => {
      const members = getPostsInSeries(s.slug, posts); // draft 제외·order 정렬
      if (members.length === 0) return null;            // 발행 0편 숨김
      const lastUpdated = members
        .map((p) => p.date)
        .sort()                                         // asc
        .at(-1)!;                                        // 최신
      return {
        slug: s.slug, title: s.title, description: s.description,
        count: members.length, lastUpdated, complete: s.complete,
      };
    })
    .filter((c): c is SeriesCard => c !== null)
    .sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1)); // 최신 활동순

  return {
    ongoing: cards.filter((c) => !c.complete),
    complete: cards.filter((c) => c.complete),
  };
}
```

- [ ] **Step 4: 통과 + public API + 커밋**

```ts
// entities/series/index.ts 에 추가
export { groupSeriesForList } from "./model/selectors";
export type { SeriesCard } from "./model/selectors";
```
```bash
git add -A && git commit -m "feat: groupSeriesForList (ongoing/complete, latest-activity sort)"
```

---

### Task 2.5: 페이지네이션 `paginate` (TDD, test-plan §2.1)

**Files:**
- Create: `shared/pagination/paginate.ts`, `shared/pagination/paginate.test.ts`

**Interfaces:**
- Produces: `paginate<T>(items: T[], page: number, size: number): { items: T[]; totalPages: number; outOfRange: boolean }`
  - `outOfRange`가 true면 라우트에서 `notFound()` 신호. **입력 items는 이미 draft 제외·정렬된 목록**(getPublishedPosts 결과)을 넘긴다.
- Consumes: 없음(제네릭).

- [ ] **Step 1: 실패 테스트 (§2.1 케이스 1~6·8; 7 리다이렉트는 라우트 몫)**

```ts
// shared/pagination/paginate.test.ts
import { expect, test } from "vitest";
import { paginate } from "./paginate";

const arr = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

test("25편 page2 size10 → 11~20, totalPages 3", () => {
  const r = paginate(arr(25), 2, 10);
  expect(r.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  expect(r.totalPages).toBe(3);
});
test("정확히 10편(경계) → totalPages 1", () => {
  expect(paginate(arr(10), 1, 10).totalPages).toBe(1);
});
test("11편(경계+1) → totalPages 2, 2페이지 1편", () => {
  const r = paginate(arr(11), 2, 10);
  expect(r.totalPages).toBe(2);
  expect(r.items).toEqual([11]);
});
test("0편 → totalPages 1, page1 정상, page2 outOfRange", () => {
  expect(paginate(arr(0), 1, 10)).toMatchObject({ items: [], totalPages: 1, outOfRange: false });
  expect(paginate(arr(0), 2, 10).outOfRange).toBe(true);
});
test("범위 밖 page 999 → outOfRange", () => {
  expect(paginate(arr(25), 999, 10).outOfRange).toBe(true);
});
test("page 0·음수·비정수 → outOfRange", () => {
  expect(paginate(arr(25), 0, 10).outOfRange).toBe(true);
  expect(paginate(arr(25), -1, 10).outOfRange).toBe(true);
  expect(paginate(arr(25), 1.5, 10).outOfRange).toBe(true);
});
```

> 케이스 7(`/posts/page/1` → `/posts` 리다이렉트)·8(draft 제외 후 계산)은 **라우트 계약** — Phase 4 Posts 라우트에서 "getPublishedPosts 결과를 paginate에 넘긴다"로 보장. 여기 단위 테스트 범위 아님(주석으로 남김).

- [ ] **Step 2: 실패 확인** — Run: `pnpm test shared/pagination` → FAIL.

- [ ] **Step 3: 구현**

```ts
// shared/pagination/paginate.ts
export function paginate<T>(
  items: T[], page: number, size: number,
): { items: T[]; totalPages: number; outOfRange: boolean } {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const valid = Number.isInteger(page) && page >= 1 && page <= totalPages;
  if (!valid) return { items: [], totalPages, outOfRange: true };
  const start = (page - 1) * size;
  return { items: items.slice(start, start + size), totalPages, outOfRange: false };
}
```

- [ ] **Step 4: 통과 + 커밋**

```bash
git add -A && git commit -m "feat: paginate with boundary + out-of-range handling"
```

---

### Task 2.6: 페이저 윈도 `getPageItems` (TDD, test-plan §2.2)

**Files:**
- Create: `shared/pagination/page-items.ts`, `shared/pagination/page-items.test.ts`

**Interfaces:**
- Produces: `getPageItems(current: number, total: number): Array<number | "…">` — 숫자와 생략 마커. `…`가 페이지 하나만 가리면 그 숫자를 그대로 노출.

- [ ] **Step 1: 실패 테스트 (§2.2 케이스 1~6)**

```ts
// shared/pagination/page-items.test.ts
import { expect, test } from "vitest";
import { getPageItems } from "./page-items";

test("total 적음(3) → 전부", () => {
  expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
});
test("앞쪽(1/10) → 1 2 3 … 10", () => {
  expect(getPageItems(1, 10)).toEqual([1, 2, 3, "…", 10]);
});
test("중간(5/10) → 1 … 4 5 6 … 10", () => {
  expect(getPageItems(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
});
test("끝(10/10) → 1 … 8 9 10", () => {
  expect(getPageItems(10, 10)).toEqual([1, "…", 8, 9, 10]);
});
test("생략이 1페이지만 가리면 숫자로 대체(…아님)", () => {
  // 예: current 3, total 5 → 1 2 3 4 5 (… 없이)
  expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
});
test("total 1 → [1] (호출부에서 미표시 판정)", () => {
  expect(getPageItems(1, 1)).toEqual([1]);
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test shared/pagination/page-items` → FAIL.

- [ ] **Step 3: 구현**

```ts
// shared/pagination/page-items.ts
export function getPageItems(current: number, total: number): Array<number | "…"> {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap === 2) out.push(sorted[i - 1] + 1); // 1페이지 갭 → 숫자로 메움
      else if (gap > 2) out.push("…");
    }
    out.push(sorted[i]);
  }
  return out;
}
```

- [ ] **Step 4: 통과 + 커밋**

```bash
git add -A && git commit -m "feat: getPageItems ellipsis window (collapse single-gap)"
```

---

### Task 2.7: 관련 포스팅 `getRelatedPosts` (TDD, test-plan §3.3)

**Files:**
- Modify: `entities/post/model/selectors.ts`, `entities/post/model/selectors.test.ts`, `entities/post/index.ts`

**Interfaces:**
- Produces: `getRelatedPosts(target: PostLike, posts: PostLike[], limit?: number): PostLike[]`
  - 태그 겹침 수 내림차순, 동점 시 최신순(date desc → slug asc). **자기 자신 제외.** **같은 시리즈 글 제외 안 함**(태그만 겹치면 포함). 매칭 0·태그 없음이면 `[]`. draft 제외.
- Consumes: `PostLike`, `getPublishedPosts`(정렬 재사용 가능).

- [ ] **Step 1: 실패 테스트 (§3.3 케이스 1~5)**

```ts
import { getRelatedPosts } from "./selectors";

const tagged = (slug: string, tags: string[], extra = {}) =>
  makePost({ slug, tags, ...extra });

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
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/post` → 새 5개 FAIL.

- [ ] **Step 3: 구현**

```ts
export function getRelatedPosts(
  target: PostLike, posts: PostLike[], limit = 5,
): PostLike[] {
  const targetTags = new Set(target.tags ?? []);
  if (targetTags.size === 0) return [];

  const scored = getPublishedPosts(posts)            // draft 제외 + 결정적 정렬
    .filter((p) => p.slug !== target.slug)            // 자기 자신 제외
    .map((p) => ({ p, overlap: (p.tags ?? []).filter((t) => targetTags.has(t)).length }))
    .filter((x) => x.overlap > 0);                    // 시리즈 여부로 분기하지 않음

  return scored
    .sort((a, b) => b.overlap - a.overlap)            // 겹침 내림차순; 동점은 이미 date/slug 정렬 유지(안정 정렬)
    .slice(0, limit)
    .map((x) => x.p);
}
```
> `getPublishedPosts`가 이미 `date desc → slug asc`로 정렬해 두므로, 겹침 동점의 tie-break(최신순)가 안정 정렬로 보존된다.

- [ ] **Step 4: 통과 + public API + 커밋**

```ts
// entities/post/index.ts 에 추가
export { getRelatedPosts } from "./model/selectors";
```
```bash
git add -A && git commit -m "feat: getRelatedPosts by tag overlap (self-excluded, series-agnostic)"
```

---

## Self-Review (Phase 2)

- **커버리지:** test-plan §1.1(8)·§1.2(4)·§1.3(5)·§2.1(6)·§2.2(6)·§3.1(4)·§3.3(5) 케이스 전부 태스크에 매핑. §3.2(조회수)·§4는 범위 밖(로드맵). ✅
- **플레이스홀더:** 없음 — 테스트·구현 전문. 라우트 계약으로 넘기는 케이스(§2.1-7·8)는 명시적 주석 + Phase 4 연결. ✅
- **타입 일관성:** `PostLike`/`SeriesLike` 픽스처 타입으로 모든 셀렉터 계약 고정. `getPublishedPosts`를 `getRelatedPosts`가 재사용(정렬 DRY). `SeriesNav`/`SeriesCard` 타입은 정의 파일 = 재노출 파일 일치. `paginate.outOfRange`·`getPageItems` 반환형이 Phase 4 라우트/컴포넌트와 물림. ✅

## 완료 기준

- `pnpm test` 전체 그린(신규 38 케이스 포함), `pnpm typecheck` 통과.
- 다음: `phase-3-design-system.md`(2와 병렬 가능) / `phase-4-pages.md`.
