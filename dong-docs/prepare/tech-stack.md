# dongCoding — 기술 스택 결정 문서 (Tech Stack SSOT)

> `design.md`가 **디자인의 단일 출처**라면, 이 문서는 **기술 결정의 단일 출처**입니다.
> "무엇을 쓰는가"가 아니라 **"왜 이 스택이 필요한가"** 를 요구사항과 1:1로 매핑해 근거를 남깁니다.
> 애매한 선택은 `대안 → 선택 → 이유` 3단으로 기록해 나중에 되돌리기 쉽게 격리합니다.

---

## 0. 이 블로그가 지켜야 할 제1원칙

기술 선택은 전부 아래 세 가지에서 파생됩니다. 스택을 추가할 때마다 이 원칙에 위배되지 않는지 점검합니다.

1. **글에 집중.** 판단 기준은 딱 하나 — *"이 요소가 읽기를 돕는가, 아니면 주의를 훔치는가."*
   - **배제**: 로딩 바·자동재생·소란스러운 사이드바·무한 진행 표시 등 **피로·산만 유발 요소.**
   - **환영**: 커버·그림·도식·수식처럼 **콘텐츠에 복무하는 시각 요소.**
   - ⚠️ "글만 / 텍스트만"이 **아니다** — 흔한 오해. 미니멀은 *산만함을 줄이는 것*이지 *이미지를 금지하는 것*이 아니다.
2. **복무하지 않으면 넣지 않는다.** 모든 기술·요소는 "글을 더 잘 읽게 하는가"로 정당화되어야 한다. 그렇지 않으면 뺀다.
3. **플랜테리어(plant + interior)에서 온 은유.** 줄기-잎 모티프, 천천히 자라는 기록. (상세는 `design.md`)

> ⚠️ **원칙 vs 요구의 긴장 지점 — 명시적으로 화해시킴**
> "산만함 배제"와 "따라다니는 목차"가 함께 있다. 목차는 본질적으로 사이드 요소라 자칫 주의를 훔친다.
> **결정:** 목차는 넣되 **"은은한 보조"** 로 격하한다 — 저대비·무소음·읽는 중에만 희미하게, 데스크탑 여백 안쪽에만. 모바일에선 숨긴다. (상세 §5.1)

---

## 1. 스택 한눈에 보기

| 층위 | 선택 | 상태 |
|---|---|---|
| 프레임워크 | **Next.js 16** (App Router, Turbopack, SSG) | 확정 |
| 언어·패키지 | **TypeScript** · **pnpm** | 확정 |
| 콘텐츠 형식 | **MDX** | 확정 |
| UI 프리미티브 | **shadcn/ui** (Tailwind v4 기준) | 확정 |
| 스타일 | **Tailwind CSS v4** (CSS-first `@theme`) | 확정 |
| 폰트 로딩 | **Pretendard** Variable (`next/font/local` 셀프호스트) + 코드 **JetBrains Mono** (`next/font/google`) | 확정 |
| 콘텐츠 파이프라인 | **Velite** | 재평가 후 채택 |
| 아키텍처 | **경량 FSD** (app 얇게 + entities/widgets + MDX 3분할) | 재평가 후 채택 |
| 코드 하이라이팅 | **rehype-pretty-code** (shiki 내장) | 확정 |
| 헤딩·목차 | **rehype-slug** + **rehype-autolink-headings** + Velite `s.toc()` | 확정 |
| 수학 수식 | **remark-math** + **rehype-katex** (KaTeX) | 확정 |
| 다크모드 | **`light-dark()` CSS** + 쿠키 기반 SSR | 확정 (design.md 준수) |
| RSS 피드 | **`app/feed.xml` Route Handler** + `feed` 패키지 (요약+링크) | 확정 |
| OG 이미지 | **`opengraph-image.tsx` + `next/og`** (커버 우선 / 텍스트 폴백) | 확정 |
| 품질 | **ESLint 9 flat** + Prettier (lefthook 선택) | 확정 / 선택 |
| 배포 | **Vercel** (SSG, `images.unoptimized`) | 확정 |

---

## 2. 확정 스택 — 재평가 없이 채택 (요구사항 직결)

이 층위는 요구사항에 직접 명시되었거나 대안이 사실상 없어 재검토하지 않는다.

### 2.1 Next.js 16 (App Router · Turbopack · SSG)
- **왜:** 콘텐츠는 레포 안 `content/**/*.mdx`, 외부 CMS 없음 → **빌드타임 SSG**가 정답. `generateStaticParams`로 전 글 프리렌더 → 요청마다 도는 SSR 불필요.
- **원칙 정합:** 정적 HTML은 로딩 스피너 같은 "피로 요소"를 구조적으로 없앤다. 글이 즉시 떠 있는 상태가 기본.
- **주의:** `next lint`는 Next 16에서 제거됨 → ESLint flat config 직접 구성(§6).

### 2.2 TypeScript · pnpm
- **왜:** Velite가 생성하는 콘텐츠 타입, entities 셀렉터, MDX 컴포넌트 맵의 계약을 컴파일 타임에 강제. pnpm은 빠른 설치·엄격한 의존성 격리.
- **강제 규칙 — 패키지 매니저는 pnpm만.** `npm`·`yarn` 사용 금지. 모든 설치·스크립트 실행은 `pnpm`(`pnpm add`, `pnpm dlx`, `pnpm <script>`). `package-lock.json`·`yarn.lock`이 생기면 안 되고, `pnpm-lock.yaml`만 커밋한다. (`package.json`의 `"packageManager": "pnpm@…"` 필드로 고정 권장)

### 2.3 MDX
- **왜:** 두 요구를 동시에 만족하는 유일한 형식 — ① 마크다운 본문(글 집중), ② **커스텀 인터랙션 컴포넌트 삽입**(가끔 캔버스 위젯). 순수 md는 ②를 못 하고, 순수 JSX는 ①의 글쓰기 경험을 해친다.

### 2.4 shadcn/ui + Tailwind CSS v4
- **왜(shadcn):** 소유하는 컴포넌트(복사 기반)라 5색 토큰·줄기-잎 미학에 맞춰 자유롭게 개조 가능. 런타임 의존성·블랙박스 스타일이 없어 "글에 집중" 원칙과 충돌하지 않는다.
- **왜(Tailwind v4 CSS-first):** `design.md`가 이미 `--paper`/`--ink`/`--moss` 등 **CSS 변수 토큰**으로 서술됨. v4의 `@theme`(globals.css)이 이 토큰 모델과 1:1로 맞는다. `tailwind.config.js` 중심 구성은 토큰 이중 정의를 낳으므로 피한다.
- **결정:** shadcn도 **v4 기준**으로 설치(CLI는 `shadcn`).

### 2.5 Pretendard
- **왜:** `design.md §2.2`의 `--sans` 지정 폰트. 본문·UI 전체 기본. 한글 본문 가독성의 바닥값.

---

## 3. 재평가 후 채택 — 핵심 권고 (대안 → 선택 → 이유)

개인 기술 블로그라는 규모를 감안해, 셋업 프롬프트가 강하게 규정한 무거운 결정들을 **요구사항 대비 정말 필요한지** 다시 따졌다. 결론은 **"절리급 유지"** — 값을 하는 것만 남기고 과함은 덜어냄.

### 3.1 콘텐츠 파이프라인 → **Velite 채택**

**대안 비교**

| 후보 | 타입 frontmatter | 이미지 blur+치수 | TOC 데이터 | 시리즈 참조 검증 | 무게 |
|---|---|---|---|---|---|
| gray-matter + 수제 | ✗(직접) | ✗(직접) | ✗(직접) | ✗(직접) | 가벼움, 그러나 전부 수작업 |
| @next/mdx | ✗ | ✗ | ✗ | ✗ | 가장 가벼움, 컬렉션 개념 없음 |
| **Velite** | ✓ `s.metadata` | ✓ `s.image()` | ✓ `s.toc()` | ✓ `prepare` 훅 | 중간, 요구와 정합 |

**선택: Velite**

**이유:** 이번 블로그의 요구사항 4개가 정확히 Velite의 기능과 겹친다.
- **따라다니는 목차** → `s.toc()`가 빌드타임에 목차 트리를 뽑아준다 (런타임 파싱 불필요 = 피로 요소 없음).
- **이미지 자동 처리** → `s.image()`가 blur placeholder + 치수를 빌드타임에 산출.
- **시리즈(엔티티)** → `prepare` 훅에서 존재하지 않는 시리즈 참조 시 **빌드를 깨뜨려** 데이터 정합성 보장.
- **요약/발췌** → `s.excerpt()`.

gray-matter로 가면 위 4개를 전부 손으로 재구현해야 하므로, "가벼움"의 이득이 사라진다.

**주의사항(빌드 안정성):**
- Velite를 `next.config.ts` 안 `build()`로 돌리지 않는다 → Vercel에서 sharp 충돌(`free(): invalid size`). **package.json 별도 스텝으로 분리**: `"build": "velite --clean && next build"`.
- `.velite/` 생성물은 gitignore. route/view에서 **직접 import 금지** — 반드시 `@/entities/post`·`@/entities/series`의 public API 경유.

#### 3.1.1 시리즈 모델링 & 검증 (Velite 활용의 핵심)

시리즈는 "같은 성격의 컬럼을 순서대로 묶은 것"(예: `클로드코드 입문(1)`, `(2)`)이며, 태그가 아니라 **자체 메타데이터와 관계를 가진 1급 엔티티**다. Velite를 제대로 쓰는 지점이 바로 여기.

**원칙: "라벨은 사람용, 진실은 `order`."**
제목의 `(1)(2)`는 사람이 읽는 표시일 뿐이고, 순서의 기계적 진실은 별도 `order` 필드가 담는다. **제목을 파싱해 순서를 추론하지 않는다**(오타·형식 변경에 취약).

**모델링 — 두 컬렉션으로 분리:**

```
content/
  series/claude-code-intro.yml     # 시리즈 "정의" (표지·설명·랜딩 메타)
  posts/claude-code-intro-1.mdx    # 시리즈에 "속한" 글
  posts/claude-code-intro-2.mdx
```

`series/*.yml` (시리즈 정의):
```yaml
slug: claude-code-intro
title: 클로드코드 입문
description: 처음 시작하는 사람을 위한 안내
cover: ./covers/claude-intro.png   # s.image() — blur+치수 자동
order: 1                           # 시리즈 목록에서의 표시 순서
complete: false                    # true면 /series의 "완결" 그룹으로 (기본 false=진행 중, pages-plan §3.1)
```

포스트 frontmatter (참조 + 회차):
```yaml
title: 클로드코드 입문(1)
series: claude-code-intro          # 위 slug 참조
order: 1                           # 시리즈 안에서의 회차
```

> **왜 yml 별도 파일인가:** 시리즈는 자체 표지·설명·랜딩(`/blog/series/[slug]`)을 가지므로 독립 메타데이터 자리가 필요하다. 포스트 frontmatter에서만 유도하면 시리즈 제목/표지를 둘 곳이 없다.

**검증 — 두 층으로 나눔:**

① **필드 층 (Zod 스키마, 문서 내부):** 타입·필수값 + refine 규칙 하나 — **`series`를 지정하면 `order`는 필수.**
```ts
posts schema .refine(
  (d) => !d.series || d.order !== undefined,
  '시리즈에 속한 글은 order가 반드시 있어야 합니다'
)
```

② **교차 참조 층 (`prepare` 훅, 전체 컬렉션을 다 본 뒤) — 진짜 안전장치:**
```ts
prepare: ({ posts, series }) => {
  const known = new Set(series.map(s => s.slug))

  for (const p of posts) {
    // (a) 참조 무결성: 없는 시리즈를 가리키면 빌드 중단
    if (p.series && !known.has(p.series))
      throw new Error(`포스트 "${p.slug}"가 없는 시리즈 "${p.series}" 참조`)
  }

  for (const s of series) {
    const orders = posts.filter(p => p.series === s.slug).map(p => p.order).sort()
    // (b) order 중복 금지: 같은 회차 두 개면 nav가 깨짐 → 빌드 중단
    if (new Set(orders).size !== orders.length)
      throw new Error(`시리즈 "${s.slug}"에 중복 order: ${orders}`)
    // (c) 연속성(1..N 빈틈): 아래 정책 — 빈틈은 경고만
  }
}
```

이 `throw`가 §3.1의 빌드 차단 메커니즘(`velite --clean && next build`)과 물려서, **시리즈 데이터가 깨지면 배포가 막히고 현재 라이브 버전이 유지된다.**

**정책 결정 (확정):**

| 항목 | 결정 | 이유 |
|---|---|---|
| order 부여 | **필수 명시** | "(1)(2)" 라벨과 일치하고 결정적. 날짜순 자동 추론 안 함 |
| 회차 중복(같은 order 2개) | **에러 → 빌드 중단** | nav의 이전/다음이 모호해짐 |
| 회차 연속성(1,2,3 빈틈) | **경고만** | 집필 중 특정 회차가 아직 초안이라 빠질 수 있음 |

**이 설계가 자동으로 주는 것 (관계 계산은 `entities/series/model/selectors.ts`):**
- `getSeriesNav(postSlug)` → `{ series, index, total, prev, next }` — 글 하단 "2/5 · 이전/다음" (§5.2)
- `getPostsInSeries(slug)` → order 정렬 목록 — `/blog/series/[slug]` 랜딩
- 없는 시리즈 참조·회차 충돌 시 **배포 차단**

### 3.2 아키텍처 → **경량 FSD 채택**

**대안 비교**

| 후보 | 캔버스 위젯 cross-import 회피 | 관심사 분리 | 학습·유지 비용 |
|---|---|---|---|
| 단순 feature 폴더 | 어려움(맵 조립 위치 모호) | 낮음 | 낮음 |
| **경량 FSD** | **MDX 3분할로 해결** | 적정 | 중간 |
| 전면 FSD + steiger 강제 | 해결 | 높음 | 높음(1인엔 과함) |

**선택: 경량 FSD**

**이유:** 전면 FSD의 이득 대부분은 **딱 한 가지 문제** — "가끔 쓰는 `ssr:false` 캔버스 위젯을 어디서 조립하나"에서 나온다. 이건 **MDX 3분할**로 해결되며, 나머지 FSD 세리머니(features 레이어 전개, steiger 린트 강제)는 1인 블로그에 오버엔지니어링이다.

**유지하는 것:**
- `app/` = 얇게 (라우팅 + 앱 셸: 프로바이더, globals.css). 비즈니스 로직 금지.
- `entities/{post,series}` = `.velite` 접근 유일 진입점 + 셀렉터(`getPostBySlug`, `getSeriesNav` 등).
- `widgets/{series-nav, series-toc, interactive/*}`.
- **MDX 3분할**(핵심):
  1. `shared/mdx/MDXContent.tsx` — Velite `code` 평가하는 범용 `"use client"` 렌더러. 특정 위젯을 모른다.
  2. `shared/mdx/light-components.tsx` — `Callout`·`Counter` 등 `shared/ui`만 참조.
  3. `views/post-page/lib/mdx-components.tsx` — 경량 맵 + `dynamic(ssr:false)` 캔버스 위젯 합성.

**덜어내는 것:**
- `steiger`(FSD 린터)는 **선택 사항**으로 격리. 규율이 필요하다 느껴질 때 추가.
- `features/` 레이어는 실제 기능(검색·테마 토글)이 생길 때 도입. 지금은 비워둔다.

---

## 4. 마크다운 렌더링 · 수식 · 다크모드

### 4.1 코드 하이라이팅 → **rehype-pretty-code**
- **왜:** `design.md §4.4`가 코드 블록(패널 배경 + line 테두리 + 10px radius)과 인라인 코드 칩을 규정. rehype-pretty-code는 빌드타임 하이라이팅이라 **런타임 JS 0** = 피로 요소 없음.
- **주의:** shiki를 별도 rehype 플러그인으로 추가하지 않는다. rehype-pretty-code의 **내부 엔진**이다. `rehype-pretty-code`만 등록.

### 4.2 헤딩 앵커 · 목차 데이터
- **rehype-slug** — 헤딩에 id 부여(목차 앵커 타겟).
- **rehype-autolink-headings** — 헤딩 자기 링크.
- 목차 트리 자체는 **Velite `s.toc()`** 가 담당(§3.1).
- **remark-gfm**(또는 Velite `gfm:true`) — 표·체크박스 등.

### 4.3 수학 수식 → **remark-math + rehype-katex (KaTeX)**
- **왜:** 요구 = "인라인 혹은 미드블록으로 md 기반으로 편하게". `remark-math`가 `$...$`(인라인)·`$$...$$`(블록) 문법을 파싱하고 `rehype-katex`가 렌더.
- **KaTeX vs MathJax:** KaTeX 선택. **빌드/서버 렌더 시 정적 HTML+CSS로 출력** → 런타임 수식 조판 없음 = 글이 즉시 안정된 상태로 뜬다(원칙 1·2 정합). MathJax는 런타임이 무겁다.
- **비용:** KaTeX CSS(폰트 포함)를 로드해야 함. 수식 쓰는 글에서만 유효하도록 격리 고려.

### 4.4 다크모드 → **`light-dark()` CSS + 쿠키 SSR** (design.md 준수)
- **왜:** `design.md §2.1`이 이미 방식을 확정 — 토큰 하나에 두 값(`light-dark(...)`), `color-scheme` 스위칭. 중복 정의 없음.
- **무설정 기본:** `color-scheme: light dark` → OS 설정 자동 추종(JS 불필요).
- **FOUC 방지(App Router):** 수동 선택을 **쿠키**에 저장하고 서버에서 `<html data-theme={cookie}>`로 렌더. 인라인 스크립트 방식이면 `suppressHydrationWarning`.
- **다크는 1급 모드** — 대충 반전이 아니라 5토큰 값 반전(design.md 규칙).

---

## 5. 읽기 경험 요소 — 원칙과의 화해

### 5.1 따라다니는 목차 → **은은한 보조 (저대비·무소음·데스크탑 전용)**
- **데이터:** Velite `s.toc()` (빌드타임, 런타임 파싱 없음).
- **동작:** 현재 섹션 하이라이트는 **IntersectionObserver** — 스크롤 이벤트 폴링 없이 관찰자 기반이라 가볍고 조용하다.
- **배치:** 데스크탑에서 `--measure` 바깥 여백(§5.3의 1280~1920 안쪽)에 **저대비**로. `--stone` 톤, 애니메이션 없음. **모바일·태블릿에선 숨김**.
- **원칙 정합:** 로딩 바처럼 "진행을 재촉하는" 요소가 아니라, 필요할 때만 눈에 들어오는 정적 이정표. 원칙 1의 "피로 요소"에 해당하지 않도록 격하했다.

### 5.2 관련 포스팅 보러가기 → **글 하단, 정적**
- **데이터:** `entities/series/model/selectors.ts` (`getSeriesNav` → `{index, total, prev, next}`) + 태그 기반 관련 글.
- **관련 글 계산 정책(확정 2026-07-02 — `test-plan.md §3.3`):** **순수 태그 겹침만으로 계산.** 겹치는 태그 수 내림차순(동점 시 최신순), **자기 자신 제외**. **같은 시리즈 글도 제외하지 않는다** — series-nav와 중복될 수 있으나 관련도는 태그 기준으로만 단순 판정하고 시리즈 여부로 분기하지 않는다(셀렉터가 시리즈 정보에 의존하지 않아 순수·테스트 단순). 매칭 0편이면 섹션 통째 생략(`pages-plan §7.1`).
- **배치:** 사이드가 아니라 **본문이 끝난 하단**에. 읽는 동안엔 보이지 않아 집중을 해치지 않는다.
- **시리즈 네비:** `widgets/series-nav`가 "N/M · 이전/다음"을 하단에 렌더.

### 5.3 레이아웃 폭 정책 → **CSS만으로**
- **요구:** `min-width: 1280`, `max-width: 1920`, 그 바깥은 회색, 콘텐츠는 가운데.
- **구현:** 콘텐츠 컬럼은 `design.md §2.3`의 `--measure`(가독 폭)로 가운데 정렬하고, 1920 초과 영역만 중립 회색으로. 별도 JS 불필요.
- **주의:** `design.md`의 가독 폭(본문 `43rem`)과 이 요구(1280~1920 프레임)는 **다른 층위** — 프레임은 뷰포트, measure는 텍스트 컬럼. 둘을 중첩(프레임 안에 가운데 정렬된 좁은 컬럼)으로 구현.

### 5.4 반응형 퍼블리싱 순서 → **모바일 → 태블릿 → 데스크탑**
- **왜:** `design.md §2.7` 브레이크포인트(`≤480`, `≥768`)와 정합. 모바일 우선으로 퍼블리싱하면 좁은 화면의 "글에 집중" 경험이 기준이 되고, 데스크탑은 여백·목차를 얹는 방향으로 확장.

---

## 6. 품질 · 배포

### 6.1 사이트맵/robots → **App Router 네이티브**
- **선택:** `app/sitemap.ts` + `app/robots.ts`. `next-sitemap` **사용 안 함** — 프레임워크 네이티브로 충분하고 의존성 하나 줄인다.
- **접근:** `@/entities/post`·`@/entities/series` public API 경유.

### 6.2 이미지 → **Vercel 재최적화 끄기**
- **`images.unoptimized: true`**(또는 커스텀 loader). Velite가 빌드타임에 이미 blur+치수를 산출하므로 Vercel 이미지 최적화 쿼터(Hobby)를 쓰지 않는다.

### 6.3 린트·포맷 → **ESLint 9 flat + Prettier**
- **왜:** `next lint`가 Next 16에서 제거됨 → `eslint.config.mjs` 직접 구성. `lint` 스크립트는 `eslint .`.
- **lefthook + lint-staged:** pre-commit 훅. 1인 워크플로엔 **선택 사항**으로 두되, 커밋 위생을 위해 권장.

### 6.4 배포 → **Vercel (SSG)**
- main push → 자동 재배포. CI(`.github/workflows/ci.yml`)는 **검사만**(build → lint → typecheck, Node 22), 배포는 Vercel 네이티브.
- **package.json 스크립트 골격:**
  ```json
  {
    "dev": "run-p dev:*",
    "dev:content": "velite --watch",
    "dev:next": "next dev",
    "build": "velite --clean && next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
  ```

### 6.5 RSS 피드 → **`app/feed.xml` Route Handler + `feed` 패키지**
- **왜:** nav·footer·`pages-plan §0`에 RSS가 명시됨. App Router GET Route Handler에 `export const dynamic = 'force-static'`를 두면 **빌드타임에 한 번 생성**돼 CDN에 얹힌다 → 런타임 조판·피로 요소 0(§0 정합). §6.1의 sitemap/robots와 동일 패턴.
- **선택:** XML 수동 조립은 이스케이프 버그(`&`·`<`)에 취약 → 검증된 `feed` 패키지(RSS 2.0/Atom/JSON을 한 소스로). 접근은 **`@/entities/post` public API 경유**(§6.1 규칙), 절대 URL은 sitemap이 쓰는 base URL(env) 재사용.
- **본문 범위 — 요약+링크만:** Velite `s.mdx()`는 본문을 컴파일된 JS로 준다(HTML 문자열 아님) → 전문 RSS는 피드용 HTML 재렌더(수식·하이라이팅 포함)가 필요하므로 복잡도 회피. 필드: `title`·`link`(slug 절대 URL)·`description`(→`excerpt` 폴백)·`pubDate`(date)·`guid`, `draft:true` 제외.

### 6.6 OG 이미지 → **`opengraph-image.tsx` + `next/og`**
- **왜:** `content-plan §1.5` — ①커버 있으면 커버를 OG로, ②없으면 **빌드타임 텍스트 폴백.** 파일 컨벤션(`app/posts/[slug]/opengraph-image.tsx`)은 `generateStaticParams`로 프리렌더되는 SSG에서 **글마다 PNG로 굳는다** → 공유 시 런타임 생성 0.
- **분기:** `generateMetadata`에서 `openGraph.images = post.cover ?? 생성 이미지`. 텍스트 카드는 **5색 토큰+잎 모티프+제목/브랜드**로 design.md 정합(새 색 금지 규칙 적용). `twitter.images`도 동일 세팅.
- **주의:** satori는 폰트 데이터를 직접 받는다 → §6.7의 셀프호스트 Pretendard 파일을 빌드타임에 읽어 `ImageResponse`의 `fonts`에 전달(파일 재사용). `images.unoptimized`(§6.2)는 `next/image` 얘기라 OG 생성과 무관.

### 6.7 폰트 로딩 → **`next/font/local` 셀프호스트(Pretendard Variable) + `next/font/google`(JetBrains Mono)**
- **왜:** `design.md §2.5`는 폰트만 지정하고 로딩 방식은 미정이었다(프로토타입은 CDN). 셀프호스트는 렌더 블로킹 외부 요청을 없애 글이 즉시 뜨고(§0), `next/font`가 `size-adjust`를 주입해 **FOUT 레이아웃 시프트를 제거**한다.
- **선택:** Pretendard **Variable woff2 1개**로 design.md의 weight 400·500·600·700을 전부 커버 → 설정 단순. 코드용 JetBrains Mono는 라틴·숫자만 쓰므로 `next/font/google`(latin subset)로 가볍게.
- **번들 오해 방지:** 셀프호스트해도 woff2는 **JS 번들에 안 들어간다** — `/_next/static/media/*.woff2` 별도 정적 에셋으로 뽑혀 `immutable` 캐시로 서빙된다(페이지 JS/HTML 용량 불변). "정적 서빙 = 번들 비대"는 오해. 어느 방식이든 폰트는 결국 CDN(셀프호스트=Vercel, 대안=서드파티)에서 온다.
- **트레이드오프:** 한글 Variable woff2는 ~1MB(레포·첫 방문 다운로드 기준). `immutable` 캐시로 첫 방문 후엔 재다운로드 없음. 페이지당 바이트를 더 줄여야 하면 그때 subset/동적 subset으로 격하(YAGNI — 지금은 Variable 셀프호스트). 서드파티 CDN 동적 subset은 바이트는 가볍지만 외부 의존·FOUT/CLS를 되살려 §0/§2와 어긋나므로 채택하지 않음.

---

## 7. `design.md`와의 접점 (기술 ↔ 디자인 계약)

이 문서와 디자인 문서가 만나는 지점. 한쪽을 바꾸면 다른 쪽을 확인한다.

| design.md 요소 | 이 문서의 기술 담당 |
|---|---|
| 5색 토큰 · `light-dark()` | Tailwind v4 `@theme` + CSS 변수 (§2.4, §4.4) |
| `--sans` Pretendard | 폰트 로딩 — `next/font/local` 셀프호스트 (§2.5, §6.7) |
| 코드 블록 스타일(§4.4) | rehype-pretty-code 출력에 토큰 매핑 (§4.1) |
| 줄기-잎 목록 모티프(§3) | post index 컴포넌트 (entities/post/ui) |
| 접근성(포커스·모션·ARIA) | 컴포넌트 구현 기본값, KaTeX/목차도 준수 |
| 브레이크포인트(§2.7) | 반응형 퍼블리싱 순서 (§5.4) |

---

## 8. 보류 · 후속 (지금 넣지 않음 — YAGNI)

원칙 2("글을 더 잘 읽게 하는 것만")를 통과하지 못하거나, 아직 필요가 증명되지 않은 것들. **자리만 두고 실제 구현은 미룬다.**

- **검색** — Pagefind(정적, 빌드타임 인덱스) 기본 후보 / fuse.js 대안. 글이 쌓인 뒤 도입.
- **댓글** — giscus stub.
- **조회수 집계 → 채택됨** (보류 해제). Upstash Redis(Vercel Marketplace, 무료 플랜) + ISR로 Home "가장 많이 본" 구현. 실패 시 폴백 정책 포함. → 상세 `pages-plan.md §5`.
- **방문 통계 대시보드** — `@vercel/analytics` 등은 여전히 보류. "피로 요소" 여부 재검토 후.
- **steiger** — FSD 린트. 규율 필요 시.
- **실제 캔버스 위젯** — 지금은 stub 1개로 3분할 파이프라인만 검증.

> 이 항목들을 도입할 땐 반드시 **§0 원칙 3개를 통과하는지** 먼저 적고 넣는다.

---

## 결정 요약 (한 줄)

**Next 16 SSG + MDX + Velite(타입·이미지·TOC·시리즈검증) 위에, 경량 FSD로 캔버스 위젯만 격리하고, KaTeX·rehype-pretty-code로 정적 렌더를 유지해 "오로지 글" 원칙을 기술적으로 강제한다.**
