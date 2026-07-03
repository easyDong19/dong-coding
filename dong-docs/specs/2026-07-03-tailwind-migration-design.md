# CSS Modules → 유틸리티 우선 Tailwind 마이그레이션 (설계 스펙)

- **작성일:** 2026-07-03
- **상태:** 구현 완료 (2026-07-04, 브랜치 `refactor/tailwind-migration` — PR-1~4 + 문서 반영. CSS Modules 0개)
- **정본 참조:** `dong-docs/prepare/tech-stack.md §2.4`, `dong-docs/design.md`, `dong-docs/prepare/branch-strategy.md`

---

## 1. 배경 · 문제

이 블로그는 스타일을 **두 층**으로 쓰고 있다.

- **토큰/테마 층:** Tailwind v4 (`app/globals.css`의 `@import "tailwindcss"` + `@theme`). 확정 스택.
- **컴포넌트 스타일:** CSS Modules (`*.module.css`) 19개 — 모든 view/widget/shared/entities 슬라이스.

`tech-stack.md`가 확정한 것은 "**Tailwind v4로 토큰을 정의한다**"였지 "유틸리티 클래스로 컴포넌트를 짠다"가 아니었다. 실제 컴포넌트는 프로토타입(`dong-docs/prototype/styles.css`, 수제 vanilla CSS)을 거의 1:1로 CSS Modules에 옮기면서 굳어졌고, **이 선택은 SSOT 어디에도 기록되지 않았다**(문서-구현 드리프트).

사용자 결정: **컴포넌트 스타일을 유틸리티 우선(utility-first) Tailwind로 전환한다.** 동기는 (a) 저작 속도·DX(파일 왕복 제거), (b) 5색 토큰·타입스케일의 유틸리티 강제, (c) shadcn/Tailwind 생태계 표준 정합, (d) 반복되는 레이아웃/spacing 규칙의 중복 감소 — 네 가지 모두.

## 2. 목표 · 비목표

**목표**
- 19개 `.module.css`를 제거하고 컴포넌트 chrome을 Tailwind 유틸리티로 전환.
- 시각 결과물은 **무회귀**(픽셀 동등을 지향). 색은 동일 토큰에서 나오므로 AA 대비는 구조적으로 보존.
- 전환 후 스타일 저작 경로를 단일화: **토큰은 `@theme`, 조판은 JSX 유틸리티, 표현 불가한 것만 얇은 CSS 층**.

**비목표 (YAGNI)**
- 다크모드 메커니즘 변경 금지 — `light-dark()` + `color-scheme`/`data-theme` 수동 토글은 **그대로 유지**.
- 디자인 변경 금지 — 5색·타입스케일·줄기-잎 모티프는 `design.md` 그대로. 새 색/폰트/임의 크기 도입 안 함.
- shadcn 프리미티브 대량 도입, 컴포넌트 API 리팩터 등 스타일과 무관한 개선은 범위 밖.

## 3. 최종 형태 — 실용적 하이브리드

유틸리티로 **깔끔하게 표현되지 않는 두 영역**은 얇은 CSS 층으로 유지한다.

| 영역 | 처리 |
|---|---|
| 컴포넌트 chrome (레이아웃·spacing·색·타이포·상태) | **Tailwind 유틸리티** (JSX `className`) |
| MDX 본문 (마크다운이 생성하는 `<h2><p><ul>` — className 주입 불가) | `globals.css`의 **`.prose` 스코프 선택자** (토큰 참조) |
| 줄기-잎 모티프 (`::before` SVG 잎, `position` 줄기 선 등 가상요소·복합 선택자) | v4 **`@utility`** 정의 → JSX에서 클래스처럼 사용 |
| 맨몸 요소 base (`body/a/html/:focus-visible`) | `globals.css` base 층 유지 |

결과: `.module.css` 파일은 0개, `globals.css`는 "토큰(`@theme`) + base + `.prose` + `@utility` 모티프"로 구성.

## 4. 설계 상세

### A. 토큰 층 완성 — `app/globals.css @theme` (관문)

**문제:** 5색 브랜드 컬러가 `@theme`이 아니라 `:root`에 `--paper`/`--ink`/`--moss`/`--stone`/`--line`(+`--panel`/`--moss-soft`)로 선언돼 있다. Tailwind v4는 `@theme` 안의 토큰만 유틸리티로 방출하므로 현재 `bg-paper`·`text-ink`·`border-line`이 **생성되지 않는다**. (`--text-*`·`--radius-*`·`--font-*`는 이미 `@theme`에 있어 유틸리티화됨.)

**변경:**
- 5색 + 파생 2색을 `@theme`으로 승격하되 **값의 `light-dark()`는 유지**. `@theme` 안에서 `--color-<name>` 네임스페이스로 선언한다.
  ```css
  @theme {
    --color-paper:     light-dark(#f4f5ee, #14180f);
    --color-ink:       light-dark(#232a22, #e7eadf);
    --color-moss:      light-dark(#4f6442, #9bbe84);
    --color-stone:     light-dark(#6b7163, #9aa08f);
    --color-line:      light-dark(#e2e3da, #2b3226);
    --color-panel:     light-dark(rgba(35,42,34,.045), rgba(231,234,223,.05));
    --color-moss-soft: light-dark(rgba(79,100,66,.1), rgba(155,190,132,.14));
  }
  ```
  → `bg-paper text-ink border-line bg-panel bg-moss-soft` 등 생성.
  - ⚠️ **`@theme inline` 금지** — inline은 유틸리티에 값을 그대로 인라인해 `light-dark()`가 사용 지점의 `color-scheme`를 따라가는 메커니즘을 깨뜨릴 수 있다. 일반 `@theme`(`:root`에 var 방출, 유틸리티는 `var(--color-*)` 참조)로 선언한다.
- `color-scheme: light dark` 및 `:root[data-theme="light|dark"]{ color-scheme: … }` 토글 블록은 **그대로 둔다** — `light-dark()`가 `color-scheme`를 따라가는 메커니즘 불변.
- 레이아웃 폭: `--measure`/`--reading`를 `--container-measure`/`--container-reading`로 노출 → `max-w-measure`/`max-w-reading` 사용 가능. 반응형 `--measure`(≥768 48rem) 미디어쿼리는 유지. `--gutter`(clamp)는 토큰 유지, `px-[var(--gutter)]` 또는 전용 유틸로 참조.
- 검증: 승격 후 `--paper` 등 구(舊) 이름을 참조하던 곳이 없는지 grep. (CSS Modules 삭제와 함께 정리)

> **주의:** 토큰 이름이 `--paper` → `--color-paper`로 바뀌므로, `.prose`/base/`@utility` 등 **유지 CSS 층에서의 참조도 `var(--color-*)`로 함께 갱신**한다.

### B. 유지되는 얇은 CSS 층 — `app/globals.css`

- **Base:** `* { box-sizing }`, `html`(scrollbar-gutter·scroll-padding), `body`(배경·색·폰트·`word-break: keep-all`), `h1~h3 text-wrap: balance`, `p/li text-wrap: pretty`, `a`, `:focus-visible`, `time/.tnum` — 유지(맨몸 요소 대상, 유틸리티로 매 요소에 붙이는 것보다 base가 적절).
- **`.wrap` 공통 컬럼:** 유지하거나 `mx-auto max-w-measure px-[var(--gutter)]` 조합으로 대체(택1, 구현 시 결정 — 유지가 더 단순).
- **전역 요소 층 vs `.prose` — 이중 구조 정리 (사이드이펙트 점검 결과):** `globals.css`에는 이미 `pre`/`code`/`table`/`.leaf-bullet`/언어 배지 등이 **전역**(스코프 없이) 스타일돼 있고(사실상 사이트 전체 prose 층), `PostView.module.css`의 `.body`가 그 위에 h2 ¶모티프·h3·blockquote 등을 재정의한다. **결정:** 전역 요소 층은 그대로 유지(다른 페이지의 코드 칩·표 스타일 보존), **`.prose`에는 글 본문 전용 규칙만** 이전(h2 모티프, h3, blockquote, 본문 간격 등). 이전 시 전역 층과 중복·충돌하는 선언은 한쪽으로 통합. 토큰(`var(--color-*)`, `var(--text-*)`, `var(--radius-*)`)에서 값 획득. `@tailwindcss/typography` 플러그인은 **도입하지 않음**(하이브리드 결정 — 수제 스코프가 5색·모티프에 더 정밀).
- **줄기-잎 모티프 `@utility`:** 재사용되는 모티프를 v4 `@utility`로 정의(예: `@utility leaf-bullet { … }`, `@utility stem { … }` 등 — 실제 목록은 현행 module.css의 잎/줄기 규칙을 조사해 확정). JSX에서 `className="leaf-bullet"`처럼 사용.
- **모션 블록 (사이드이펙트 점검 결과):** `PostList.module.css`의 `@keyframes sprout` + `nth-child` 스태거 딜레이는 CSS Modules가 keyframe 이름을 해시해주던 것 — module 삭제 시 **`@keyframes sprout`를 globals로 이전**하고, 스태거(`nth-child` 딜레이)는 유틸리티로 표현이 지저분하므로 `@utility`(또는 globals 블록)로 유지. `prefers-reduced-motion: no-preference` 가드 불변.

### C. 컴포넌트 마이그레이션 — 슬라이스별 점진 진행

**규칙**
- 각 `.module.css`: 스타일을 대응 컴포넌트의 JSX 유틸리티로 옮기고 파일 삭제, `import styles from …` 제거.
- 유틸리티로 표현 불가한 것:
  - 가상요소·자식/상태 선택자 → 임의 variant(`[&::before]:…`, `[&>li]:…`, `data-[state=…]:…`).
  - 2곳 이상 반복되거나 복잡하면 → 공용 `@utility`로 승격(모티프와 동일 원칙).
- 색·간격·타이포·반경은 **토큰 유틸리티만** 사용(`bg-paper`, `text-lg`, `rounded-pill`, `gap-*`). 임의 색/px 신규 도입 금지(`design.md`).

**클래스 병합 헬퍼 (사이드이펙트 점검 결과)**
`Eyebrow`/`TagChip` 등이 `[styles.x, className].join(" ")`으로 외부 `className`을 받는다. 유틸리티 전환 후엔 내부 `text-stone` vs 호출부 `text-ink` 같은 충돌이 문자열 병합으로 해소되지 않는다. → **PR-1에서 `clsx` + `tailwind-merge` 기반 `cn` 헬퍼를 `shared/lib`에 도입**한다. 신규 의존성 근거: 유틸리티 우선 전환의 직접 파생 요구(외부 className 허용 컴포넌트의 충돌 해소)이며, 둘 다 런타임 극소·표준 조합(shadcn 기본 구성과 동일).

**순서 (그룹 = PR 1개, squash, PR 제목은 커밋 컨벤션 `refactor: …`)**

1. **PR-1 토큰·유지층 기반:** §A 토큰 승격 + §B `.prose`/base 정리 + 모티프 `@utility` 뼈대 + `cn` 헬퍼. (컴포넌트는 아직 그대로 — 이 PR은 토큰/유틸 인프라만, 시각 무변화 검증.)
2. **PR-2 `shared` (4):** `shared/theme/ThemeToggle`, `shared/ui/Eyebrow`, `shared/ui/TagChip`, `shared/ui/EmptyState`.
3. **PR-3 `widgets` (7):** `footer`, `masthead`, `pagination/Pager`, `related`, `series-card`, `series-nav`, `toc/Toc`.
4. **PR-4 `views` (7) + `entities` (1):** `home`, `posts`, `series`(List·Detail), `about`(AboutView·About), `post-page/PostView`, `entities/post/ui/PostList`.

> 그룹 크기는 리뷰 부담에 따라 구현 단계에서 더 잘게 쪼갤 수 있다(예: views를 2개 PR로). 순서(토큰 → shared → widgets → views)는 고정.

**대상 19개 파일 (전수)**

```
entities/post/ui/PostList.module.css
shared/theme/ThemeToggle.module.css
shared/ui/Eyebrow.module.css
shared/ui/TagChip.module.css
shared/ui/EmptyState.module.css
views/home/HomeView.module.css
views/posts/PostsView.module.css
views/series/SeriesListView.module.css
views/series/SeriesDetailView.module.css
views/about/AboutView.module.css
views/about/components/About.module.css
views/post-page/PostView.module.css        # → 상당 부분이 .prose 스코프로 이전
widgets/footer/Footer.module.css
widgets/masthead/Masthead.module.css
widgets/pagination/Pager.module.css
widgets/related/Related.module.css
widgets/series-card/SeriesCard.module.css
widgets/series-nav/SeriesNav.module.css
widgets/toc/Toc.module.css
```

### D. 시각 무회귀 검증

- **슬라이스마다:** dev 서버로 현행과 대조. 가능하면 전/후 스크린샷 비교(라이트/다크 양쪽).
- **대비:** 색이 동일 토큰에서 나오므로 AA는 구조적으로 보존. `#12`에서 맞춘 stone 대비 등 회귀 없음 확인.
- **테스트:** 기존 Vitest 테마 해석 테스트(`shared/theme/resolve-theme.ts`) green 유지. 빌드 게이트(`velite --strict` 등) 통과.
- **접근성:** `:focus-visible` 링, 키보드 이동 유지 확인.

### E. 문서 드리프트 해소

- `tech-stack.md §2.4`에 결정 기록(`대안 → 선택 → 이유` 3단): "**컴포넌트 스타일 = 유틸리티 우선 Tailwind; MDX 본문·모티프만 `globals.css` 얇은 층. CSS Modules 폐지.**" — CSS Modules를 쓰던 이전 상태와 전환 이유(드리프트 해소·DX·토큰 강제)를 함께.
- 이 스펙 문서를 근거로 링크.

## 5. 리스크 · 주의

- **토큰 이름 변경 파급:** `--paper` → `--color-paper` 승격 시 유지 CSS 층의 모든 참조(점검 시점 18곳, 전부 `app/globals.css` 내)를 함께 갱신해야 함(누락 시 스타일 깨짐). TSX/TS 인라인 `var(--paper…)` 참조는 **0건**으로 확인됨 — 파급은 CSS 파일로 한정. PR-1에서 grep으로 전수 재확인.
- **MDX 본문:** `.prose` 스코프가 rehype-pretty-code(코드블록)·KaTeX(수식)·이미지와 충돌하지 않도록 기존 `.body` 규칙을 손실 없이 이전. 코드 하이라이팅/수식은 별도 CSS라 건드리지 않음.
- **긴 유틸리티 문자열:** "글에 집중" 원칙과 마크업 가독성 — 복잡한 조합은 `@utility`로 승격해 JSX를 깨끗이 유지(무지성 유틸 나열 지양).
- **진행 중 타 작업과 충돌:** 이 마이그레이션은 거의 모든 슬라이스를 건드리므로, **다른 브랜치 작업이 없는 시점에** 시작한다(현재 `main` clean 확인됨). 잔여 워크트리 `.claude/worktrees/feat+toc-scrollspy`는 정리 대상(무관).

## 6. 완료 기준

- [ ] `*.module.css` 0개 (worktree 제외).
- [ ] 5색·파생 색이 `@theme`에서 유틸리티로 생성되고, 컴포넌트가 토큰 유틸리티만 사용.
- [ ] MDX 본문·모티프가 `.prose`/`@utility`로 동작, 시각 무회귀(라이트/다크).
- [ ] 빌드·테스트·린트 green.
- [ ] `tech-stack.md §2.4` 결정 반영.
