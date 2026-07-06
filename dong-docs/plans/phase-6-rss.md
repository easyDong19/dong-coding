# Phase 6 — RSS 피드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **후속 플랜:** 로드맵 §0 "RSS 피드(`tech-stack §6.5`)"의 구현. Phase 0~5 완료가 전제.

**Goal:** `/feed.xml`을 빌드타임에 정적 생성(RSS 2.0)하고, 절대 URL base 로더(`getSiteUrl`)를 신설해 RSS가 첫 소비자가 되게 한다. 피드는 **요약+링크만** 담고, base URL env 누락 시 **빌드를 실패**시킨다(fail-fast).

**Architecture:** I/O 없는 순수 매핑과 정적 라우트 조립을 분리한다.
- **순수 함수**(목 없이 픽스처 테스트): `getSiteUrl`(env 가드·throw), `pickDek`(description→excerpt 폴백), `toFeedItems`(발행 글 → RSS 필드 배열). 전부 `shared/config`·`entities/post`에 위치.
- **정적 라우트 조립**(테스트 안 함, `feed` 패키지 책임): `app/feed.xml/route.ts` GET + `dynamic = "force-static"` → 빌드타임 1회 `feed.rss2()` 직렬화 → CDN 정적 서빙.
- **노출**: `<head>`에 RSS auto-discovery `<link rel="alternate">`(layout metadata) + About `SocialLinks`의 rss 경로 확정(`/rss.xml` → `/feed.xml`).

**Tech Stack:** `feed` 패키지(RSS 2.0/Atom/JSON 한 소스), Next 16 Route Handler(`app/**/route.ts`) + `export const dynamic = "force-static"`(빌드타임 생성 — `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` 확인), Vitest.

## Global Constraints

`00-roadmap.md §2` 적용. 특히 이 플랜 고유:
- **본문 범위 — 요약+링크만(§6.5):** Velite `s.mdx()`는 컴파일된 JS(HTML 문자열 아님)라 전문 RSS는 피드용 HTML 재렌더가 필요 → 회피. 필드: `title`·`link`(slug 절대 URL)·`description`(→ `excerpt` 폴백)·`pubDate`(date)·`guid`(=link).
- **fail-fast(test-plan §5.1-4, 확정 2026-07-02):** base URL env 누락 시 `getSiteUrl`이 **throw** → `next build` 실패. 깨진 절대 URL이 담긴 RSS가 조용히 배포되는 것보다 낫다. ↔ 대조: 조회수(Phase 5)는 실패를 삼켜 폴백 — RSS는 정반대 정책(**비필수 아님, 배포 게이트**).
- **XML 이스케이프는 `feed` 패키지 책임(test-plan §0.2):** `&`·`<` 등 수동 조립 금지, 테스트도 안 함.
- **`.velite` 접근(§3.1):** 라우트는 `.velite` 직접 import 금지 → `@/entities/post` public API(`listFeedItems`) 경유.
- **패키지 매니저:** `pnpm` 전용. 설치는 `pnpm add feed`.
- **draft 제외는 상류 한 곳(test-plan line 137):** `getPublishedPosts`가 이미 보장 → `toFeedItems`는 발행 글만 받는다(자체 필터 안 함). draft 케이스(§5.1-3)는 §3.1에서 이미 커버됨.

---

## ⚠️ 사용자 수동 단계 (인프라 — 코드로 못 함)

- [ ] **(사용자) 배포 도메인 확정 후 `NEXT_PUBLIC_SITE_URL` 설정** — Vercel 프로젝트 env + 로컬 `.env.local`(Task 6.1에서 `.env.local.example`에 템플릿 추가됨)에 배포 절대 URL(예: `https://dongcoding.dev`)을 넣는다. **이 값이 없으면 `pnpm build`가 의도적으로 실패**한다(fail-fast). `pnpm test`는 env 없이도 통과.

---

### Task 6.1: `feed` 의존성 + 절대 URL 로더 `getSiteUrl` (env 가드, TDD)

**Files:**
- Modify: `package.json`(의존성), `shared/config/index.ts`(재노출), `.env.local.example`(템플릿)
- Create: `shared/config/site.ts`, `shared/config/site.test.ts`

**Interfaces:**
- Produces:
  - `getSiteUrl(): string` — `NEXT_PUBLIC_SITE_URL`을 읽어 끝 슬래시 제거 후 반환. env 누락/빈값 → `throw`.
  - `SITE_NAME`·`SITE_DESCRIPTION`·`SITE_LANGUAGE`·`SITE_COPYRIGHT: string` — 피드/메타 단일 소스.
- Consumes: `feed`(Task 6.4에서 사용), `process.env`.

- [ ] **Step 1: 의존성 설치**

Run: `pnpm add feed`
Expected: `package.json` dependencies에 `feed` 추가, `pnpm-lock.yaml` 갱신.

- [ ] **Step 2: 실패 테스트 — getSiteUrl**

```ts
// shared/config/site.test.ts
import { afterEach, expect, test, vi } from "vitest";
import { getSiteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

test("env 있으면 그대로 반환", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dongcoding.dev");
  expect(getSiteUrl()).toBe("https://dongcoding.dev");
});
test("끝 슬래시 제거 (경로 결합 안전)", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dongcoding.dev/");
  expect(getSiteUrl()).toBe("https://dongcoding.dev");
});
test("§5.1-4: env 빈값 → throw (fail-fast)", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  expect(() => getSiteUrl()).toThrow();
});
```

- [ ] **Step 3: 실패 확인** — Run: `pnpm test shared/config/site` → FAIL(`getSiteUrl` 미정의).

- [ ] **Step 4: 구현**

```ts
// shared/config/site.ts
// 사이트 절대 URL·메타 — RSS(및 향후 sitemap/OG)의 단일 소스.
export const SITE_NAME = "dongCoding";
export const SITE_DESCRIPTION = "코드와 식물 사이, 천천히 자라는 기록";
export const SITE_LANGUAGE = "ko";
export const SITE_COPYRIGHT = "© 2026 dongCoding. All rights reserved.";

/**
 * 절대 URL base. env 누락 시 throw(fail-fast) — 깨진 절대 URL이 담긴 RSS가
 * 조용히 배포되느니 빌드를 막는다 (test-plan §5.1-4, 확정 2026-07-02).
 * 끝 슬래시를 제거해 `${getSiteUrl()}/posts/${slug}` 결합이 항상 안전.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL이 필요합니다(RSS 절대 URL). 배포 도메인을 env에 설정하세요.",
    );
  }
  return url.replace(/\/+$/, "");
}
```

- [ ] **Step 5: 통과 확인** — Run: `pnpm test shared/config/site` → all passed.

- [ ] **Step 6: 배럴 재노출**

```ts
// shared/config/index.ts (파일 하단에 추가 — 기존 상수 3개는 유지)
export * from "./site";
```

- [ ] **Step 7: env 템플릿 추가**

`.env.local.example` 하단에 추가:
```bash
# RSS 절대 URL — 누락 시 빌드 실패(fail-fast). 배포 도메인으로 채운다.
NEXT_PUBLIC_SITE_URL=
```

- [ ] **Step 8: 커밋**

```bash
git add -A && git commit -m "chore: add feed dep and getSiteUrl base-url loader (fail-fast)"
```

---

### Task 6.2: `pickDek` 폴백 함수 추출 (TDD, test-plan §5.1-1·2)

> 현재 [`PostListItem.tsx:15`](../../entities/post/ui/PostListItem.tsx)의 `post.description ?? post.excerpt` 인라인 로직을 공용 함수로 뽑아 목록 dek과 RSS description이 **같은 규칙**을 쓰게 한다(content-plan §1.4). `PostLike`에 `excerpt`가 없으므로 픽스처 타입을 먼저 확장.

**Files:**
- Modify: `shared/test/factories.ts`(`PostLike`에 `excerpt` 추가), `entities/post/ui/PostListItem.tsx`(인라인 → `pickDek`), `entities/post/index.ts`(재노출)
- Create: `entities/post/model/dek.ts`, `entities/post/model/dek.test.ts`

**Interfaces:**
- Produces: `pickDek(post: Pick<PostLike, "description" | "excerpt">): string | undefined` — `description` 우선, 없으면 `excerpt`.
- Consumes: `PostLike`(factories).

- [ ] **Step 1: 픽스처 타입 확장**

```ts
// shared/test/factories.ts — PostLike에 excerpt 필드 추가 (description 아래)
export type PostLike = {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  tags?: string[];
  series?: string;
  order?: number;
  description?: string;
  excerpt?: string;
};
```
(`makePost` 본문은 그대로 — `excerpt`는 옵셔널이라 기본값 불필요.)

- [ ] **Step 2: 실패 테스트 — pickDek**

```ts
// entities/post/model/dek.test.ts
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
```

- [ ] **Step 3: 실패 확인** — Run: `pnpm test entities/post/model/dek` → FAIL(`pickDek` 미정의).

- [ ] **Step 4: 구현**

```ts
// entities/post/model/dek.ts
import type { PostLike } from "@/shared/test/factories";

/** 목록 dek·RSS description 공용 폴백: description 우선, 없으면 excerpt (test-plan §5.1-1·2, content-plan §1.4). */
export function pickDek(post: Pick<PostLike, "description" | "excerpt">): string | undefined {
  return post.description ?? post.excerpt;
}
```

- [ ] **Step 5: 통과 확인** — Run: `pnpm test entities/post/model/dek` → all passed.

- [ ] **Step 6: PostListItem이 pickDek 사용**

`entities/post/ui/PostListItem.tsx` 상단 import에 추가하고 `dek` 계산을 교체:
```tsx
import { pickDek } from "../model/dek";
```
```tsx
  const dek = pickDek(post);
```
(15행 `const dek = post.description ?? post.excerpt;` 를 위 한 줄로 대체. 나머지 JSX·`{dek ? ...}`는 그대로.)

- [ ] **Step 7: public API 재노출**

```ts
// entities/post/index.ts (파일 하단, export 블록에 추가)
export { pickDek } from "./model/dek";
```

- [ ] **Step 8: 검증 + 커밋**

Run: `pnpm test entities/post` → all passed (기존 셀렉터 테스트 포함).

```bash
git add -A && git commit -m "refactor: extract pickDek fallback shared by list dek and RSS"
```

---

### Task 6.3: `toFeedItems` 필드 매핑 (TDD, test-plan §5.1)

**Files:**
- Modify: `entities/post/index.ts`(`listFeedItems` 조립 + 재노출)
- Create: `entities/post/model/feed-items.ts`, `entities/post/model/feed-items.test.ts`

**Interfaces:**
- Produces:
  - `type FeedItem = { title: string; link: string; description?: string; date: string }`.
  - `toFeedItems<T extends PostLike>(posts: T[], siteUrl: string): FeedItem[]` — 발행 글 → RSS 필드. `link`=slug 절대 URL(=guid).
  - `listFeedItems(): FeedItem[]`(index.ts) — `toFeedItems(getPublishedPosts(raw), getSiteUrl())`.
- Consumes: `pickDek`(Task 6.2), `getPublishedPosts`·`getSiteUrl`.

- [ ] **Step 1: 실패 테스트 — toFeedItems**

```ts
// entities/post/model/feed-items.test.ts
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
```

> draft 제외(§5.1-3)는 상류 `getPublishedPosts`(§3.1에서 검증됨)가 보장 → `toFeedItems`는 발행 글만 받으므로 여기서 재테스트하지 않음.

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/post/model/feed-items` → FAIL(`toFeedItems` 미정의).

- [ ] **Step 3: 구현**

```ts
// entities/post/model/feed-items.ts
import type { PostLike } from "@/shared/test/factories";
import { pickDek } from "./dek";

export type FeedItem = {
  title: string;
  link: string; // slug 절대 URL — guid로도 사용
  description?: string;
  date: string; // isodate — route에서 new Date()로 변환
};

/** 발행 글 → RSS 필드 매핑 (test-plan §5.1). draft 제외는 상류 getPublishedPosts 책임. */
export function toFeedItems<T extends PostLike>(posts: T[], siteUrl: string): FeedItem[] {
  return posts.map((p) => ({
    title: p.title,
    link: `${siteUrl}/posts/${p.slug}`,
    description: pickDek(p),
    date: p.date,
  }));
}
```

- [ ] **Step 4: 통과 확인** — Run: `pnpm test entities/post/model/feed-items` → all passed.

- [ ] **Step 5: index.ts에 조립 함수 + 재노출**

```ts
// entities/post/index.ts
// 상단 import에 추가:
import { getSiteUrl } from "@/shared/config";
import { toFeedItems } from "./model/feed-items";
```
```ts
// 함수 블록에 추가 (listPopularPosts 아래 등):
export function listFeedItems() {
  return toFeedItems(getPublishedPosts(raw), getSiteUrl()); // draft/삭제 자연 배제 + 절대 URL
}
```
```ts
// export 블록에 추가:
export { toFeedItems } from "./model/feed-items";
export type { FeedItem } from "./model/feed-items";
```

- [ ] **Step 6: 검증 + 커밋**

Run: `pnpm test entities/post` → all passed.

```bash
git add -A && git commit -m "feat: add toFeedItems selector mapping posts to RSS fields (test-plan §5.1)"
```

---

### Task 6.4: `/feed.xml` Route Handler (빌드타임 정적 생성)

> Next 16 Route Handler + `export const dynamic = "force-static"` → 빌드타임 1회 생성돼 CDN 정적 서빙(`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` §Caching). XML 이스케이프는 `feed` 패키지가 처리.

**Files:**
- Create: `app/feed.xml/route.ts`

**Interfaces:**
- Consumes: `listFeedItems`(Task 6.3), `getSiteUrl`·`SITE_*`(Task 6.1), `feed` 패키지.
- Produces: `GET /feed.xml` → RSS 2.0 XML(`Content-Type: application/xml`).

- [ ] **Step 1: 라우트 구현**

```ts
// app/feed.xml/route.ts
import { Feed } from "feed";
import { listFeedItems } from "@/entities/post";
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION, SITE_LANGUAGE, SITE_COPYRIGHT } from "@/shared/config";

// 빌드타임 1회 생성 → CDN 정적 서빙 (tech-stack §6.5, Next 16 route-handlers.md §Caching)
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const site = getSiteUrl(); // env 누락 시 throw → 빌드 실패 (fail-fast, test-plan §5.1-4)
  const feed = new Feed({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: site,
    link: site,
    language: SITE_LANGUAGE,
    copyright: SITE_COPYRIGHT,
    feedLinks: { rss: `${site}/feed.xml` }, // ⚠️ 키는 `rss` (feed 패키지가 rss2 self-link 방출 시 읽는 키). `rss2`는 인덱스 시그니처 때문에 타입은 통과하나 런타임 무시됨
  });

  for (const item of listFeedItems()) {
    feed.addItem({
      title: item.title,
      id: item.link, // guid = 절대 URL
      link: item.link,
      description: item.description,
      date: new Date(item.date),
    });
  }

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
```

> `new Feed`의 `copyright`는 필수 필드다(빠지면 타입 에러) — `SITE_COPYRIGHT`로 채움. `feed`가 CJS/타입 문제로 import 에러 시: `import feedPkg from "feed"; const { Feed } = feedPkg;` 로 폴백(빌드 로그 보고 판단).

- [ ] **Step 2: 검증 (env 있음)**

```bash
NEXT_PUBLIC_SITE_URL=https://dongcoding.dev pnpm build
```
Expected: 빌드 통과, `.next` 출력에 `/feed.xml` 정적 생성. (로컬 `.env.local`에 값이 있으면 그냥 `pnpm build`.)

- [ ] **Step 3: 검증 (env 없음 → fail-fast 확인)**

env가 설정 안 된 셸에서:
```bash
pnpm build
```
Expected: **빌드 실패**(`NEXT_PUBLIC_SITE_URL이 필요합니다...`) — 의도된 fail-fast(§5.1-4). 확인 후 env 채우고 다시 빌드.

- [ ] **Step 4: 커밋**

```bash
git add -A && git commit -m "feat: add /feed.xml route handler built statically at build time"
```

---

### Task 6.5: RSS 노출 — head auto-discovery + About 링크 확정

> `pages-plan §0`의 "RSS 노출". 리더 앱 자동 구독용 `<head>` 링크 + About의 rss 아이콘 경로를 실제 엔드포인트(`/feed.xml`)로 확정. Footer는 브랜드·저작권만(design.md §4.10) — 여기 건드리지 않음.

**Files:**
- Modify: `app/layout.tsx`(metadata alternates), `entities/about/data.ts`(rss 경로)

**Interfaces:**
- Consumes: `/feed.xml`(Task 6.4).

- [ ] **Step 1: head auto-discovery 링크**

`app/layout.tsx`의 `metadata` 객체에 `alternates` 추가:
```ts
export const metadata: Metadata = {
  title: "dongCoding",
  description: "코드와 식물 사이, 천천히 자라는 기록",
  alternates: {
    types: { "application/rss+xml": "/feed.xml" }, // RSS 리더 auto-discovery
  },
};
```

- [ ] **Step 2: About rss 경로 확정**

`entities/about/data.ts` — TODO 주석의 임시 경로를 실제 엔드포인트로:
```ts
    rss: '/feed.xml',
```
(기존 `rss: '/rss.xml'` 교체. 위의 `// TODO(공개 전 확인): rss 경로는 RSS 구현 후 확정...` 주석은 삭제 — 확정 완료.)

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm test && NEXT_PUBLIC_SITE_URL=https://dongcoding.dev pnpm build`
Expected: 테스트 그린 + 빌드 통과. 렌더된 `<head>`에 `<link rel="alternate" type="application/rss+xml" href="/feed.xml">`, About에 RSS 아이콘이 `/feed.xml`로 링크.

```bash
git add -A && git commit -m "feat: expose RSS via head auto-discovery link and About icon"
```

---

### Task 6.6: 문서 위생 — 로드맵 갱신

**Files:**
- Modify: `dong-docs/plans/00-roadmap.md`

- [ ] **Step 1: §0 남은 항목에서 RSS 제거**

`00-roadmap.md` §0(현재 line 11) — RSS를 완료로 표기:
```
**후속 플랜(YAGNI):** 조회수 시스템(Redis, `pages-plan §5`) → **✅ 완료 `phase-5-viewcount.md`.** RSS 피드(`tech-stack §6.5`) → **✅ 완료 `phase-6-rss.md`.** 남은 것: OG 이미지(`tech-stack §6.6`), 검색·댓글.
```

- [ ] **Step 2: §1 페이즈 지도에 Phase 6 행 추가**

`| **5. 조회수(후속)** | ...` 행 아래에 추가:
```
| **6. RSS(후속)** | `phase-6-rss.md` | `/feed.xml` 정적 생성·`getSiteUrl` 로더·head 링크·About 노출 | RSS 필드 매핑 `test-plan §5.1` |
```

- [ ] **Step 3: §3 test-plan 매핑 갱신**

`| §5.1 RSS 필드 매핑 | feed 조립 | — | ⏭ RSS 플랜 |` 행을 교체:
```
| §5.1 RSS 필드 매핑 | `pickDek`·`toFeedItems`·`getSiteUrl` | 6 | ✅ |
```

- [ ] **Step 4: 커밋**

```bash
git add -A && git commit -m "docs: mark RSS feed (phase 6) done in roadmap"
```

---

## Self-Review (Phase 6)

- **스펙 커버리지:**
  - tech-stack §6.5(엔드포인트 `app/feed.xml` + `force-static` + `feed` 패키지 + 요약+링크 + 필드) → Task 6.3·6.4. ✅
  - test-plan §5.1-1(description 사용) → 6.2·6.3. §5.1-2(excerpt 폴백) → 6.2·6.3. §5.1-3(draft 제외) → 상류 §3.1 위임(주석 명시). §5.1-4(link/guid 절대 URL·env 누락 빌드 실패) → 6.1(throw)·6.3(link)·6.4(fail-fast 빌드). ✅
  - pages-plan §0(RSS 노출) → 6.5(head 링크 + About). ✅
- **플레이스홀더:** 없음 — 모든 테스트/구현 코드 전문 제공. `feed` CJS import 폴백만 조건부 주석으로 명시. ✅
- **타입 일관성:** `getSiteUrl(): string`(6.1) = 6.3·6.4 사용. `pickDek(post): string | undefined`(6.2) = 6.3 `toFeedItems` 내부 사용 = `FeedItem.description?: string`와 정합. `toFeedItems<T extends PostLike>(posts, siteUrl)`(6.3) = 6.3 `listFeedItems` 호출 = 다른 셀렉터의 `<T extends PostLike>` 패턴과 동일. `FeedItem`(6.3) = route(6.4)에서 `item.title/link/description/date` 소비. ✅
- **의존 방향(FSD):** 순수 매핑(Post 의존)은 `entities/post`에 위치 → shared가 entities를 import하는 역전 없음. route(app/)가 조립. ✅
- **fail-fast 검증:** Task 6.4 Step 3에서 env 없는 빌드 실패를 명시적으로 확인(스펙 §5.1-4). ⚠️(의도적 — 로컬 빌드는 env 필요).

## 완료 기준

- `pnpm test` 그린(신규 `site`·`dek`·`feed-items` 케이스 포함).
- env 설정 시 `pnpm build` 통과 + `/feed.xml` 정적 생성(RSS 2.0, 절대 URL guid).
- env 미설정 시 `pnpm build` **의도적 실패**(fail-fast) — 스펙대로.
- `<head>`에 RSS auto-discovery 링크, About에 `/feed.xml` 아이콘 노출.
- 로드맵 §0/§1/§3 갱신(문서 위생).
