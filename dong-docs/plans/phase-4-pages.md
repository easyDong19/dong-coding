# Phase 4 — 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **참조:** 화면 구성·정책은 `pages-plan.md`, 시각 해부는 `design.md §4`, 마크업 레퍼런스는 `dong-docs/prototype/index.html`.

**Goal:** Phase 2 셀렉터와 Phase 3 디자인 시스템을 라우트로 조립한다 — Home·Posts(페이지네이션)·Series(목록/상세)·Post 상세(MDX·시리즈네비·관련글)·About·빈/에러 상태. **조회수·RSS·OG는 이 플랜 범위 밖**(후속). Home은 "최근 글"만 노출.

**Architecture:** `app/`은 얇게(라우팅+메타). 데이터는 `entities` public API 경유(`.velite` 직접 import 금지). `.velite` 로드는 `entities/*/index.ts` 진입점에서만. MDX 렌더는 `shared/mdx` 3분할(`tech-stack §3.2`). 페이지네이션은 Phase 2 `paginate`/`getPageItems` 재사용.

**Tech Stack:** Next 16 App Router(SSG·`generateStaticParams`), Velite 데이터, MDX 렌더.

## Global Constraints

`00-roadmap.md §2` 적용. 특히 **`.velite` 접근은 entities 경유**, **SSG 프리렌더**, **정렬 `date desc → slug asc`**, **빈/에러는 조용한 EmptyState**(`design.md §4.11`, `pages-plan §7`).

---

### Task 4.1: entities 진입점 — `.velite` 로드 + 셀렉터 바인딩

**Files:**
- Modify: `entities/post/index.ts`, `entities/series/index.ts`

**Interfaces:**
- Produces: 인자 없는 편의 래퍼 — `listPublishedPosts()`, `getPostBySlug(slug)`, `getSeriesNavForPost(slug)`, `getRelated(slug)`, `listSeriesGrouped()`, `getSeriesDetail(slug)`. 내부에서 `.velite`를 로드해 Phase 2 순수 셀렉터에 넘긴다. **`.velite` import는 오직 여기.**
- Consumes: Phase 2 순수 셀렉터, `@/.velite`.

- [ ] **Step 1: post 진입점**

```ts
// entities/post/index.ts
import { posts as raw } from "@/.velite";
import { getPublishedPosts, getRelatedPosts } from "./model/selectors";

export function listPublishedPosts() { return getPublishedPosts(raw); }
export function getPostBySlug(slug: string) {
  return getPublishedPosts(raw).find((p) => p.slug === slug) ?? null;
}
export function getRelated(slug: string) {
  const t = raw.find((p) => p.slug === slug);
  return t ? getRelatedPosts(t, raw) : [];
}
// 순수 셀렉터도 계속 재노출(테스트·조합용)
export * from "./model/selectors";
```
> `raw`(Velite `Post[]`)가 `PostLike`와 구조적으로 호환됨을 `pnpm typecheck`로 확인. 불일치 시 셀렉터 타입을 Velite `Post`로 승격.

- [ ] **Step 2: series 진입점**

```ts
// entities/series/index.ts
import { posts as rawPosts, series as rawSeries } from "@/.velite";
import { getSeriesNav, getPostsInSeries, groupSeriesForList } from "./model/selectors";

export function getSeriesNavForPost(slug: string) { return getSeriesNav(slug, rawPosts); }
export function listSeriesGrouped() { return groupSeriesForList(rawSeries, rawPosts); }
export function getSeriesDetail(slug: string) {
  const meta = rawSeries.find((s) => s.slug === slug) ?? null;
  return meta ? { meta, posts: getPostsInSeries(slug, rawPosts) } : null;
}
export * from "./model/selectors";
```

- [ ] **Step 3: typecheck + 커밋**

Run: `pnpm typecheck`
Expected: 통과(또는 셀렉터 타입 승격 후 통과).
```bash
git add -A && git commit -m "feat: entities entry points loading .velite via public API"
```

---

### Task 4.2: 앱 셸 — Masthead·Footer·전역 상태

**Files:**
- Create: `widgets/masthead/Masthead.tsx`, `widgets/footer/Footer.tsx`, `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: Phase 3 프리미티브(`Eyebrow`, `ThemeToggle`, `LeafSymbols`).
- Produces: 모든 페이지 공통 셸.

- [ ] **Step 1: Masthead·Footer (design.md §4.1·§4.12)**

nav = Home·Posts·Series·About(+ RSS 링크 자리·다크토글). `aria-current="page"`. Footer 잎 시그니처.

- [ ] **Step 2: 전역 404/에러 (pages-plan §7.2)**

`not-found.tsx`(eyebrow 404·"이 길에는 잎이 없습니다"·홈 링크), `error.tsx`/`global-error.tsx`(reset 버튼·스택 미노출). EmptyState 재사용.

- [ ] **Step 3: 검증 + 커밋**

`/없는경로` → 404 렌더 확인.
```bash
git add -A && git commit -m "feat: app shell (masthead, footer, 404/error states)"
```

---

### Task 4.3: Post Index 위젯 (줄기-잎 목록)

**Files:**
- Create: `entities/post/ui/PostList.tsx`, `entities/post/ui/PostListItem.tsx`

**Interfaces:**
- Consumes: `PostLike`(렌더용 필드), `TagChip`.
- Produces: `<PostList posts={...} />` — `ol.stem` + `li.post`(node·title·dek·meta·옵션 썸네일). `design.md §4.2`.

- [ ] **Step 1: 줄기-잎 목록 (design.md §3·§4.2)**

`ol.stem`(줄기 `::before` 1px)·잎 노드(`#leaf`)·제목·dek(`description`/`excerpt`)·meta(`date` tabular-nums·태그칩). 커버 있으면 고정폭 썸네일(리듬 유지). hover 시 title moss.

- [ ] **Step 2: 검증 + 커밋**

임시로 픽스처 목록 렌더 → design.md 대비.
```bash
git add -A && git commit -m "feat: PostList stem-and-leaf component"
```

---

### Task 4.4: Home (`/`) — 최근 글

**Files:**
- Create: `app/page.tsx`, `views/home/HomeView.tsx`

**Interfaces:**
- Consumes: `listPublishedPosts()`, `HOME_RECENT_COUNT`, `PostList`.
- Produces: Home 화면. **"가장 많이 본"은 조회수 플랜 전까지 미노출**(`pages-plan §5.2`: 섹션 생략이 정상 폴백). "최근 글"만.

- [ ] **Step 1: 최근 글 섹션 (pages-plan §1)**

```tsx
// app/page.tsx (발췌)
import { listPublishedPosts } from "@/entities/post";
import { HOME_RECENT_COUNT } from "@/shared/config";
// const recent = listPublishedPosts().slice(0, HOME_RECENT_COUNT);
```
글 0편이면 EmptyState("아직 심어둔 글이 없습니다…", `pages-plan §7.1`).

- [ ] **Step 2: 검증 + 커밋**

`/` 렌더 → 최근 글 목록·빈 상태 확인.
```bash
git add -A && git commit -m "feat: Home with recent posts (views section deferred)"
```

---

### Task 4.5: Posts (`/posts`, `/posts/page/[n]`) — 페이지네이션

**Files:**
- Create: `app/posts/page.tsx`, `app/posts/page/[n]/page.tsx`, `widgets/pagination/Pager.tsx`

**Interfaces:**
- Consumes: `listPublishedPosts()`, `paginate`, `getPageItems`, `POSTS_PER_PAGE`, `PostList`.
- Produces: 목록 + 하단 Pager. **정책(test-plan §2.1 케이스 7·8)을 라우트에서 보장.**

- [ ] **Step 1: `/posts` (1페이지 정규 URL)**

`listPublishedPosts()`(draft 제외 완료) → `paginate(posts, 1, POSTS_PER_PAGE)`. 0편이면 EmptyState(`pages-plan §7.1`).

- [ ] **Step 2: `/posts/page/[n]` — generateStaticParams + 경계**

```tsx
// app/posts/page/[n]/page.tsx (정책 발췌)
import { notFound, permanentRedirect } from "next/navigation";
// const page = Number(params.n);
// if (page === 1) permanentRedirect("/posts");        // §7.1 정규 URL 통일
// const r = paginate(listPublishedPosts(), page, POSTS_PER_PAGE);
// if (r.outOfRange) notFound();                        // §7.1 범위 밖 404
```
`generateStaticParams`는 2..totalPages 생성(1은 `/posts`).

- [ ] **Step 3: Pager 컴포넌트 (design.md §4.8)**

`getPageItems(current, total)` → `‹ 1 2 3 … M ›`. 현재 페이지 `aria-current="page"`+ink/moss, `…` 비인터랙티브. `<nav aria-label="페이지네이션">`. total 1이면 미표시.

- [ ] **Step 4: 검증 + 커밋**

`/posts`, `/posts/page/2`, `/posts/page/1`(→리다이렉트), `/posts/page/999`(→404) 확인.
```bash
git add -A && git commit -m "feat: Posts with path-based pagination + redirect/404 policy"
```

---

### Task 4.6: Series 목록·상세

**Files:**
- Create: `app/series/page.tsx`, `app/series/[slug]/page.tsx`, `widgets/series-card/SeriesCard.tsx`

**Interfaces:**
- Consumes: `listSeriesGrouped()`, `getSeriesDetail(slug)`, `PostList`.
- Produces: `/series`(진행/완결 그룹 그리드), `/series/[slug]`(order 목록).

- [ ] **Step 1: `/series` — 진행/완결 그룹 (pages-plan §3.1)**

`listSeriesGrouped()` → 진행 중 먼저, 완결 아래. **빈 그룹은 헤더까지 숨김.** SeriesCard(cover·title·description·"N편"·최신 업데이트일, `design.md §4.9`). 시리즈 0개면 EmptyState.

- [ ] **Step 2: `/series/[slug]` — order 목록 (pages-plan §3.2)**

`getSeriesDetail(slug)` — 없거나 발행 0편이면 `notFound()`. 헤더(title·description·cover) + order 오름차순 PostList(각 항목 "1/N" 회차). 완결이면 "완결" 배지. `generateStaticParams`로 전 시리즈 프리렌더.

- [ ] **Step 3: 검증 + 커밋**

`/series`, `/series/<slug>`, 없는 slug(→404) 확인.
```bash
git add -A && git commit -m "feat: Series list (grouped) + detail (ordered)"
```

---

### Task 4.7: Post 상세 — MDX·시리즈네비·관련글

**Files:**
- Create: `app/posts/[slug]/page.tsx`, `views/post-page/PostView.tsx`, `shared/mdx/MDXContent.tsx`, `shared/mdx/light-components.tsx`, `views/post-page/lib/mdx-components.tsx`, `widgets/series-nav/SeriesNav.tsx`, `widgets/related/Related.tsx`
- Modify: `app/globals.css`(코드블록·blockquote·KaTeX 등 본문 스타일 — Phase 3 토큰 사용)

**Interfaces:**
- Consumes: `getPostBySlug`, `getSeriesNavForPost`, `getRelated`.
- Produces: 읽기 화면(`design.md §4.4`) + series-nav(`§4.6`) + related(`§4.7`).

- [ ] **Step 1: MDX 3분할 렌더러 (tech-stack §3.2)**

`MDXContent.tsx`(범용 `"use client"` 렌더러, 특정 위젯 모름) + `light-components.tsx`(`shared/ui`만 참조) + `views/post-page/lib/mdx-components.tsx`(경량 맵; 캔버스 위젯은 이번 범위엔 stub만, `dynamic(ssr:false)` 자리 예약).

- [ ] **Step 2: 읽기 화면 (design.md §4.4)**

post-tag·H1(clamp)·byline(date tabular-nums)·본문(p/H2 ¶마커/blockquote moss/잎 불릿 ul/코드칩·블록). 커버 있으면 히어로.

- [ ] **Step 3: series-nav (design.md §4.6, pages-plan §7.1)**

`getSeriesNavForPost(slug)` → `null`이면 미표시. `prev`/`next` 카드(첫/마지막은 한쪽 빈자리). "N / M" 표시(index=정렬 위치). `≤480px` 세로 스택.

- [ ] **Step 4: related (design.md §4.7, pages-plan §7.1)**

`getRelated(slug)` → **0편이면 섹션 통째 생략.** 제목 링크 + 태그 메타.

- [ ] **Step 5: 라우트 조립 + generateStaticParams + notFound**

없는 slug/draft(빌드 제외라 slug 없음) → `notFound()`. 전 글 프리렌더.

- [ ] **Step 6: 검증 + 커밋**

시리즈 글/단독 글/없는 slug 각각 확인. series-nav 첫·마지막 회차 빈자리, related 생략 확인.
```bash
git add -A && git commit -m "feat: Post detail (MDX 3-split, series-nav, related)"
```

---

### Task 4.8: About (`/about`)

**Files:**
- Create: `app/about/page.tsx`, `content/about.mdx`, `views/about/components/{ProfileHeader,Timeline,ProjectCard}.tsx`

**Interfaces:**
- Consumes: `content/about.mdx`(MDX 컴포넌트 맵), 읽기 단일 컬럼.
- Produces: About 화면(`pages-plan §4`, `design.md §4.10`).

- [ ] **Step 1: about.mdx + 컴포넌트 주입 (pages-plan §4)**

ProfileHeader(avatar·이름·한 줄 소개)·Timeline(줄기-잎 재사용·연도 tabular-nums)·ProjectCard 그리드. 콘텐츠 미준비 시 최소 플레이스홀더 문구(`pages-plan §7.1`).

- [ ] **Step 2: 검증 + 커밋**

`/about` 렌더 확인.
```bash
git add -A && git commit -m "feat: About page via content/about.mdx components"
```

---

### Task 4.9: 마크다운 파이프라인 플러그인 (코드·목차·수식)

**Files:**
- Modify: `velite.config.ts`(mdx 옵션: remark/rehype 플러그인)
- Modify: `app/globals.css`(KaTeX·코드 하이라이트 토큰 매핑)

**Interfaces:**
- Produces: 빌드타임 코드 하이라이트·헤딩 앵커·수식(`tech-stack §4.1~4.3`). 런타임 JS 0.

- [ ] **Step 1: 플러그인 등록 (tech-stack §4)**

Velite mdx에 `rehype-pretty-code`(shiki 내장, 별도 shiki 금지)·`rehype-slug`·`rehype-autolink-headings`·`remark-math`·`rehype-katex`·`remark-gfm`(또는 `gfm:true`).

- [ ] **Step 2: 스타일 매핑 (design.md §4.4)**

코드 블록(`--panel`+`--line`+10px)·인라인 칩(`--panel` 5px)·`.c-key`(moss)·`.c-com`(stone italic)·`.c-str`(ink). KaTeX display `overflow-x:auto`.

- [ ] **Step 3: 검증 + 커밋**

코드·`$수식$`·헤딩 앵커 포함 글로 렌더 확인.
```bash
git add -A && git commit -m "feat: build-time code highlight + heading anchors + KaTeX"
```

---

## Self-Review (Phase 4)

- **커버리지:** pages-plan 전 화면(Home·Posts·Series목록/상세·Post상세·About)·빈/에러 상태(§7)·페이지네이션 정책(§2, test-plan §2.1-7·8)·MDX 3분할(tech-stack §3.2)·마크다운 파이프라인(§4) 모두 태스크로 존재. 조회수·RSS·OG는 로드맵상 범위 밖으로 명시. ✅
- **플레이스홀더:** 시각 마크업은 design.md/프로토타입 대응으로 위임(정당), 정책 분기(redirect/notFound/섹션 생략)는 구체 코드·조건 명시. 캔버스 위젯은 stub 자리 예약으로 YAGNI. ✅
- **타입 일관성:** entities 진입점 래퍼명(`listPublishedPosts`·`getPostBySlug`·`getSeriesNavForPost`·`getRelated`·`listSeriesGrouped`·`getSeriesDetail`)이 정의(4.1)=소비(4.4~4.7) 일치. `paginate.outOfRange`·`getPageItems` 반환형이 Pager·라우트와 물림. `HOME_RECENT_COUNT`·`POSTS_PER_PAGE`(shared/config) 재사용. ✅

## 완료 기준

- `pnpm build`(velite→next) 성공, 전 라우트 프리렌더, 320px 무깨짐.
- 리다이렉트(`/posts/page/1`)·404(`/posts/page/999`·없는 slug)·빈 상태·섹션 생략 전부 정책대로.
- `pnpm test` 그린 유지. **이 플랜 완료 = "글이 즉시 뜨는 정적 블로그" 동작.** 다음: 조회수/RSS/OG 후속 플랜.
