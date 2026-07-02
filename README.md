# dongCoding

> 코드와 식물 사이, 천천히 자라는 기록. Next 16 SSG + MDX + Velite 기반 정적 블로그.

디자인·기술·작업 규약의 정본(SSOT)은 [`dong-docs/`](dong-docs/)에 있습니다. 이 README는 **실사용법**만 다룹니다.

---

## 시작하기

**패키지 매니저는 pnpm 전용입니다** (`npm`·`yarn` 금지 — `tech-stack §2.2`).

```bash
pnpm install
pnpm dev        # velite --watch + next dev 동시 실행 (localhost:3000)
```

| 스크립트 | 하는 일 |
|---|---|
| `pnpm dev` | 콘텐츠 감시(velite) + 개발 서버 동시 실행 |
| `pnpm build` | `velite --clean --strict` → `next build` (전 글 프리렌더) |
| `pnpm start` | 프로덕션 서버 |
| `pnpm test` | 순수 함수 테스트(vitest) |
| `pnpm lint` / `pnpm typecheck` | ESLint / 타입 검사 |

> `.velite/`(생성물)는 gitignore이며 **entities 진입점에서만** import합니다. 라우트·컴포넌트는 `@/entities/*` public API를 경유하세요.

---

## 블로그 글 올리는 법

### 1) 글 하나 추가

`content/posts/` 아래에 `.mdx` 파일을 만듭니다. 파일명은 자유지만 **frontmatter의 `slug`가 URL**(`/posts/<slug>`)이 됩니다.

```mdx
---
title: 첫 글 제목
slug: my-first-post          # 필수 · URL이 됨 · 컬렉션 내 유일
date: 2026-07-02             # 필수 · YYYY-MM-DD
description: 목록/공유에 쓰이는 한 줄 요약   # 선택
tags: [Next, 회고]           # 선택 · 관련 글 계산에 쓰임
cover: ./covers/hello.png    # 선택 · Velite가 blur·치수 자동 산출
draft: false                 # 선택 · 기본 false
updated: 2026-07-10          # 선택
---

## 첫 문단

본문은 마크다운으로 씁니다. GFM(표·체크박스), 코드 펜스, 수식을 지원합니다.
```

**정렬**은 `date` 내림차순 → 같은 날짜면 `slug` 사전순(결정적). 미래 날짜 글도 그대로 노출됩니다.

### 2) 초안(draft)

`draft: true`인 글은 목록·상세·시리즈·관련 글 어디에도 **노출되지 않고**, 해당 URL은 404가 됩니다. 발행하려면 `draft`를 `false`로 바꾸거나 지우세요.

### 3) 마크다운에서 되는 것

- **코드 블록** — 언어를 붙이면 빌드타임에 하이라이트됩니다(런타임 JS 0). 색은 디자인 5색으로 제한(키워드=moss·주석=stone·기본=ink).
  ````md
  ```ts
  const leaf = "🌿"; // 하이라이트됨
  ```
  ````
- **수식** — 인라인 `$E = mc^2$`, 블록 `$$ ... $$` (KaTeX, 빌드타임 렌더).
- **헤딩** — 자동으로 앵커(`#슬러그`)가 붙습니다.

### 4) 시리즈로 묶기

시리즈는 태그가 아니라 **자체 메타데이터를 가진 1급 엔티티**입니다(`tech-stack §3.1.1`).

**① 시리즈 정의** — `content/series/<slug>.yml`:

```yaml
slug: claude-code-intro
title: Claude Code 입문
description: 처음 쓰는 사람을 위한 안내
cover: ./covers/claude.png   # 선택
order: 1                     # /series 목록에서의 표시 순서 (기본 1)
complete: false              # true면 "완결" 그룹으로 (기본 false = 진행 중)
```

**② 글에서 시리즈 참조** — 포스트 frontmatter에 추가:

```mdx
---
title: Claude Code 설치와 첫 실행
slug: claude-code-intro-1
date: 2026-07-02
series: claude-code-intro    # 위 시리즈 slug
order: 1                     # 시리즈 안에서의 회차 (series가 있으면 필수)
---
```

- 회차의 진실은 **`order`** 값입니다. 제목의 "(1)(2)"는 사람용 라벨일 뿐, 순서를 제목에서 추론하지 않습니다.
- 글 하단에 이전/다음 네비게이션이 자동으로 붙습니다.

### 5) 빌드 게이트 (데이터가 깨지면 배포가 막힘)

`pnpm build`의 `velite --strict`가 아래를 **빌드 실패**로 막습니다:

| 위반 | 결과 |
|---|---|
| 스키마/타입 위반, `series`인데 `order` 없음 | 빌드 실패 (`--strict`) |
| 없는 시리즈를 참조 | 빌드 실패 (prepare 훅 throw) |
| 같은 시리즈에 `order` 중복 | 빌드 실패 (prepare 훅 throw) |
| `order` 빈틈(1,2,5) | 경고만(빌드는 계속) |

> `--no-verify`·`--strict` 생략으로 게이트를 우회하지 마세요.

### 6) About 페이지

`content/about.mdx` 한 파일을 편집하면 됩니다. 커스텀 컴포넌트(`ProfileHeader`·`Timeline`·`Projects`)를 그대로 쓸 수 있습니다(아래 참조).

---

## MDX에서 JSX(커스텀 컴포넌트) 불러오는 법

MDX 본문에 `<MyWidget />` 같은 컴포넌트를 심을 수 있습니다. 렌더 파이프라인은 **3분할**입니다(`tech-stack §3.2`):

```
shared/mdx/MDXContent.tsx            범용 렌더러(client) — Velite가 컴파일한 본문을 평가. 특정 위젯을 모른다
shared/mdx/light-components.tsx      shared/ui만 참조하는 경량 컴포넌트 맵
views/<page>/lib/mdx-components.tsx  경량 맵 + (필요 시) 무거운 위젯을 합성한 최종 맵
```

라우트는 `<MDXContent code={post.body} components={맵} />`로 렌더하고, `components` 맵의 키 이름이 MDX에서 쓰는 태그가 됩니다.

### 컴포넌트 추가 3단계

**① 컴포넌트를 만든다 (반드시 `"use client"`)**

`MDXContent`가 client 렌더러라, 주입되는 컴포넌트도 client여야 합니다.

```tsx
// shared/ui/Callout.tsx (또는 뷰 로컬)
"use client";
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <aside style={{ borderLeft: "2px solid var(--moss)", paddingLeft: "1rem" }}>{children}</aside>
  );
}
```

> 색·간격은 반드시 토큰(`var(--moss)` 등)으로. hex 하드코딩 금지(`design.md §6`).

**② 맵에 등록한다**

- 모든 글에서 쓰는 범용 컴포넌트 → `shared/mdx/light-components.tsx`
- 글 상세 전용 → `views/post-page/lib/mdx-components.tsx`

```tsx
// shared/mdx/light-components.tsx
import { Callout } from "@/shared/ui/Callout";
import type { MDXComponentMap } from "./MDXContent";

export const lightComponents = { Callout } as unknown as MDXComponentMap;
```

**③ MDX에서 쓴다**

```mdx
---
title: 콜아웃 예시
slug: callout-demo
date: 2026-07-02
---

<Callout>
  이 부분은 강조됩니다. **마크다운도** 안에서 됩니다.
</Callout>
```

### props 넘기기

MDX는 JS 표현식을 props로 받습니다 — 배열·객체도 됩니다. `content/about.mdx`가 실제 예시입니다:

```mdx
<Timeline items={[{ when: "2026", what: "블로그 시작" }]} />
<Projects items={[{ title: "dongCoding", description: "이 블로그", href: "https://..." }]} />
```

해당 컴포넌트 구현은 [`views/about/components/`](views/about/components/), 맵은 [`views/about/lib/mdx-components.tsx`](views/about/lib/mdx-components.tsx)를 참고하세요.

> 무거운/`ssr:false` 캔버스 위젯은 `views/<page>/lib/mdx-components.tsx`에서 `next/dynamic`으로 합성합니다(3분할의 목적). 지금은 자리만 예약돼 있습니다.

---

## 프로젝트 구조 (경량 FSD)

```
app/          라우팅 + 앱 셸(layout·globals.css·404/error). 비즈니스 로직 없음
entities/     post·series·about — .velite 접근 유일 진입점 + 순수 셀렉터
widgets/      masthead·footer·pagination·series-card·series-nav·related
views/        home·posts·series·post-page·about — 페이지 조립
shared/       ui(프리미티브)·theme·mdx·pagination·lib·config·test
content/      posts/*.mdx · series/*.yml · about.mdx (글이 사는 곳)
dong-docs/    정본(SSOT) — design·tech-stack·pages-plan·plans 등
```

작업 규약(커밋·브랜치·PR·디자인·기술)은 [`AGENTS.md`](AGENTS.md)와 [`dong-docs/`](dong-docs/)를 따르세요.
