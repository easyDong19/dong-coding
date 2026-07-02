# Phase 1 — 콘텐츠 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **skill:** Velite 스키마는 Zod 기반 → **zod skill 사용**(Task 0.2에서 추가됨).

**Goal:** `content-plan §2`의 frontmatter 계약을 Velite 스키마로 확정하고, `tech-stack §3.1.1`의 교차 참조 검증(참조 무결성·order 중복)을 **테스트 가능한 순수 함수**로 분리해 prepare 훅에 연결한다.

**Architecture:** 검증 로직을 `velite.config.ts`에 인라인하지 않는다 → `content/lib/validate-series.ts`(순수 함수)로 분리해 config에서 import. 함수는 `{posts, series}`를 받아 문제 시 `throw`, 정상 시 무해 통과. 이렇게 해야 Vitest에서 픽스처로 throw 여부를 검증할 수 있다.

**Tech Stack:** Velite, Zod(스키마 refine), Vitest.

## Global Constraints

`00-roadmap.md §2` 적용. 특히:
- **검증 정책 정반대 주의:** 빌드타임 데이터 검증은 **일부러 throw로 깨뜨린다**(런타임 조회수 폴백과 반대). (`pages-plan §5.3`)
- **draft 제외 규칙:** prepare 검증은 **발행 글(draft:false)만** 대상 — `posts.filter(p => !p.draft)` 선적용. (`test-plan §1.4`, 확정 2026-07-02)

---

### Task 1.1: 포스트/시리즈 스키마 확정

**Files:**
- Modify: `velite.config.ts`
- Create: `content/series/.gitkeep`(이미 있으면 스킵)

**Interfaces:**
- Produces (Velite 생성 타입):
  - `Post`: `{ slug, title, date, description?, tags?, cover?, series?, order?, draft, updated?, metadata, toc, excerpt, body }`
  - `Series`: `{ slug, title, description, cover?, order, complete }`
- Consumes: 없음(스키마가 계약의 원본).

- [ ] **Step 1: posts 스키마 — content-plan §2 그대로 + refine**

```ts
// velite.config.ts (posts 발췌)
const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      date: s.isodate(),
      description: s.string().optional(),
      tags: s.array(s.string()).optional(),
      cover: s.image().optional(),
      series: s.string().optional(),
      order: s.number().int().positive().optional(),
      draft: s.boolean().default(false),
      updated: s.isodate().optional(),
      slug: s.slug("post"),
      metadata: s.metadata(),
      toc: s.toc(),
      excerpt: s.excerpt(),
      body: s.mdx(),
    })
    .refine(
      (d) => !d.series || d.order !== undefined,
      "시리즈에 속한 글은 order가 반드시 있어야 합니다",
    ),
});
```

- [ ] **Step 2: series 스키마 — tech-stack §3.1.1**

```ts
const series = defineCollection({
  name: "Series",
  pattern: "series/**/*.yml",
  schema: s.object({
    slug: s.slug("series"),
    title: s.string(),
    description: s.string(),
    cover: s.image().optional(),
    order: s.number().int().positive().default(1),
    complete: s.boolean().default(false),
  }),
});

export default defineConfig({
  collections: { posts, series },
  // prepare 훅은 Task 1.3에서 연결
});
```

- [ ] **Step 3: 검증 — 정상/위반 샘플로 빌드**

`content/series/claude-code-intro.yml` + `content/posts/claude-code-intro-1.mdx`(series/order 포함) 작성 후:
Run: `pnpm velite`
Expected: 통과. 그다음 order를 지운 글로 바꿔 재실행 → refine 에러로 실패(스키마 층 동작 확인). 확인 후 정상 샘플로 되돌림.

- [ ] **Step 4: 커밋**

```bash
git add -A && git commit -m "feat: define post/series Velite schema with order refine"
```

---

### Task 1.2: 교차 참조 검증 순수 함수 (TDD — test-plan §1.4)

**Files:**
- Create: `content/lib/validate-series.ts`, `content/lib/validate-series.test.ts`

**Interfaces:**
- Produces: `validateSeriesIntegrity(input: { posts: PostRef[]; series: SeriesRef[] }): void` — 위반 시 `throw new Error`, 정상 시 반환값 없음.
  - `PostRef = { slug: string; series?: string; order?: number; draft?: boolean }`
  - `SeriesRef = { slug: string }`
- Consumes: 픽스처(테스트) / Velite `{posts, series}`(prepare, Task 1.3).

- [ ] **Step 1: 실패 테스트 작성 — 6개 케이스(test-plan §1.4)**

```ts
// content/lib/validate-series.test.ts
import { expect, test } from "vitest";
import { validateSeriesIntegrity } from "./validate-series";

const S = (slug: string) => ({ slug });
const P = (o: Partial<{ slug: string; series: string; order: number; draft: boolean }>) =>
  ({ slug: "p", ...o });

test("1: 없는 시리즈 참조 → throw (빌드 중단)", () => {
  expect(() =>
    validateSeriesIntegrity({ posts: [P({ slug: "a", series: "ghost", order: 1 })], series: [] }),
  ).toThrow(/ghost/);
});

test("2: 같은 시리즈 중복 order → throw", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [P({ slug: "a", series: "s", order: 1 }), P({ slug: "b", series: "s", order: 1 })],
      series: [S("s")],
    }),
  ).toThrow(/중복/);
});

test("3: order 빈틈(1,3) → throw 하지 않음(경고만)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [P({ slug: "a", series: "s", order: 1 }), P({ slug: "b", series: "s", order: 3 })],
      series: [S("s")],
    }),
  ).not.toThrow();
});

test("5: 정상 데이터 → 통과", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [P({ slug: "a", series: "s", order: 1 }), P({ slug: "b", series: "s", order: 2 })],
      series: [S("s")],
    }),
  ).not.toThrow();
});

test("6: draft 글의 잘못된 참조 → throw 하지 않음(검증 제외)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [P({ slug: "a", series: "ghost", order: 1, draft: true })],
      series: [],
    }),
  ).not.toThrow();
});

test("6b: draft가 중복 order를 유발해도 무시(발행 글만 검증)", () => {
  expect(() =>
    validateSeriesIntegrity({
      posts: [
        P({ slug: "a", series: "s", order: 1 }),
        P({ slug: "b", series: "s", order: 1, draft: true }),
      ],
      series: [S("s")],
    }),
  ).not.toThrow();
});
```

> 케이스 4(refine: series 있는데 order 없음)는 **스키마 층**(Task 1.1)에서 처리되므로 이 순수 함수 테스트에는 없다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test content/lib/validate-series.test.ts`
Expected: FAIL — `validateSeriesIntegrity is not a function`.

- [ ] **Step 3: 최소 구현 — draft 선필터 후 (a) 참조 무결성 (b) order 중복**

```ts
// content/lib/validate-series.ts
type PostRef = { slug: string; series?: string; order?: number; draft?: boolean };
type SeriesRef = { slug: string };

export function validateSeriesIntegrity(input: {
  posts: PostRef[];
  series: SeriesRef[];
}): void {
  // draft는 검증 제외 (test-plan §1.4 / 확정 2026-07-02)
  const posts = input.posts.filter((p) => !p.draft);
  const known = new Set(input.series.map((s) => s.slug));

  // (a) 참조 무결성
  for (const p of posts) {
    if (p.series && !known.has(p.series)) {
      throw new Error(`포스트 "${p.slug}"가 없는 시리즈 "${p.series}" 참조`);
    }
  }

  // (b) order 중복 금지
  for (const s of input.series) {
    const orders = posts.filter((p) => p.series === s.slug).map((p) => p.order);
    if (new Set(orders).size !== orders.length) {
      throw new Error(`시리즈 "${s.slug}"에 중복 order: ${orders.join(",")}`);
    }
  }

  // (c) 연속성 빈틈은 경고만 — throw 안 함 (정책상 no-op)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test content/lib/validate-series.test.ts`
Expected: 6 passed.

- [ ] **Step 5: 커밋**

```bash
git add -A && git commit -m "feat: add pure series integrity validator (test-plan §1.4)"
```

---

### Task 1.3: prepare 훅에 검증 연결

**Files:**
- Modify: `velite.config.ts`

**Interfaces:**
- Consumes: `validateSeriesIntegrity`(Task 1.2), Velite `{posts, series}`.
- Produces: 빌드 게이트 — 데이터 위반 시 `velite`가 실패 → `velite --clean && next build` 체인이 배포를 막음(`tech-stack §3.1`).

- [ ] **Step 1: prepare 훅에서 순수 함수 호출**

```ts
// velite.config.ts (defineConfig에 추가)
export default defineConfig({
  collections: { posts, series },
  prepare: ({ posts, series }) => {
    validateSeriesIntegrity({ posts, series });
    // (c) 연속성 경고: 발행 글 기준 1..N 빈틈이면 console.warn (빌드는 계속)
    for (const s of series) {
      const orders = posts
        .filter((p) => !p.draft && p.series === s.slug)
        .map((p) => p.order!)
        .sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          console.warn(`[series:${s.slug}] order 빈틈/불연속: ${orders.join(",")}`);
          break;
        }
      }
    }
  },
});
```
`import { validateSeriesIntegrity } from "./content/lib/validate-series";` 상단 추가.

- [ ] **Step 2: 빌드 게이트 검증 — 위반 데이터로 실패 확인**

일시로 없는 시리즈를 참조하는 발행 글을 추가 후:
Run: `pnpm velite`
Expected: 비영(non-zero) 종료 + 에러 메시지. 확인 후 데이터 원복 → `pnpm velite` 통과.

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "feat: wire series validation into Velite prepare hook"
```

---

### Task 1.4: 픽스처 팩토리를 Velite 타입에 정렬

**Files:**
- Modify: `shared/test/factories.ts`

**Interfaces:**
- Produces: `makePost`/`makeSeries`가 Phase 2 셀렉터가 소비하는 필드(`slug/date/draft/tags/series/order`, `series`엔 `complete` 등)를 모두 커버.

- [ ] **Step 1: 팩토리를 실제 필드에 맞춰 확장**

```ts
// shared/test/factories.ts
export type PostLike = {
  slug: string; title: string; date: string;
  draft: boolean; tags: string[];
  series?: string; order?: number;
  description?: string;
};
export function makePost(o: Partial<PostLike> = {}): PostLike {
  return { slug: "p", title: "T", date: "2026-01-01", draft: false, tags: [], ...o };
}

export type SeriesLike = {
  slug: string; title: string; description: string;
  order: number; complete: boolean;
};
export function makeSeries(o: Partial<SeriesLike> = {}): SeriesLike {
  return { slug: "s", title: "S", description: "", order: 1, complete: false, ...o };
}
```

- [ ] **Step 2: 기존 스모크 테스트 통과 확인**

Run: `pnpm test shared/test/factories.test.ts`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "chore: align test factories with Velite post/series types"
```

---

## Self-Review (Phase 1)

- **커버리지:** 스키마(content-plan §2)·refine(§3.1.1)·교차검증(test-plan §1.4 케이스 1·2·3·5·6·6b)·prepare 연결(§3.1)·연속성 경고(§3.1.1 (c)) 모두 태스크로 존재. 케이스 4는 스키마 refine으로 커버됨을 명시. ✅
- **플레이스홀더:** 없음 — 모든 테스트/구현 코드 전문 제공. ✅
- **타입 일관성:** `validateSeriesIntegrity` 시그니처가 Task 1.2 정의 = Task 1.3 호출 = prepare 인자와 일치. `PostRef`(검증용 최소)와 `PostLike`(셀렉터 픽스처용)는 의도적으로 다른 범위임을 구분. ✅

## 완료 기준

- `pnpm test` 그린(validate-series 6 케이스 포함), `pnpm velite` 정상, 위반 데이터로 빌드 실패 재현됨.
- 다음: `phase-2-entities-selectors.md`.
