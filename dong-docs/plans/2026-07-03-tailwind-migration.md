# CSS Modules → 유틸리티 우선 Tailwind 마이그레이션 — 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 19개 `*.module.css`를 제거하고 컴포넌트 스타일을 유틸리티 우선 Tailwind로 전환하되, MDX 본문·잎 모티프·모션은 `globals.css`의 얇은 층으로 유지하고 시각 결과물은 무회귀로 보존한다.

**Architecture:** 5색 브랜드 토큰을 `@theme`으로 승격해 `bg-paper`/`text-ink` 등 유틸리티를 생성하고, 표현 불가 영역(MDX `.prose` 스코프·잎 모티프·`sprout` 모션)만 `globals.css`에 남긴다. 외부 `className`을 받는 컴포넌트의 유틸리티 충돌은 `cn`(clsx+tailwind-merge)으로 해소한다. 슬라이스별 4개 PR로 점진 진행한다.

**Tech Stack:** Next 16(App Router·SSG), Tailwind CSS v4(CSS-first `@theme`/`@utility`), TypeScript, pnpm, clsx, tailwind-merge, Vitest.

**정본 참조:** 설계 스펙 `dong-docs/specs/2026-07-03-tailwind-migration-design.md`, `dong-docs/design.md`, `dong-docs/prepare/tech-stack.md §2.4`, `dong-docs/prepare/branch-strategy.md`, `dong-docs/prepare/commit-convention.md`.

## Global Constraints

- **패키지 매니저는 pnpm 전용.** `pnpm add`/`pnpm dlx`/`pnpm <script>`만. npm/yarn 금지.
- **커밋 형식** `<type>: <제목>` — type 7개(`feat fix post docs style refactor chore`)만, 제목 끝 마침표 없음, 72자 이내, 스코프 없음. `--no-verify` 금지.
- **커밋·PR·머지는 사용자 승인 후에만.** 한 번의 승인은 1회 한정. 이 플랜의 각 `git commit` 스텝은 실행 전 사용자 확인을 받는다.
- **브랜치:** 이 마이그레이션 전체가 `refactor/tailwind-migration` 브랜치(이미 생성됨, 스펙 커밋 `6786ec0` 포함). 그룹(PR) 단위로 나눠 머지하려면 각 그룹을 별도 `refactor/*` 브랜치로 재분기한다(브랜치 1개=PR 1개).
- **디자인 불변:** 5색·타입스케일·줄기-잎 모티프는 `design.md` 그대로. 새 색/폰트/임의 px 도입 금지. 색·간격·반경·타이포는 토큰 유틸리티만 사용.
- **다크모드 메커니즘 불변:** `light-dark()` + `color-scheme`/`data-theme` 토글 유지. `@theme inline` 사용 금지.
- **검증 명령:** 린트 `pnpm lint`, 테스트 `pnpm test`, 빌드 `pnpm build`(= `velite --clean --strict && next build`), 개발 서버 `pnpm dev`.
- **무회귀:** 각 슬라이스 전환 후 `pnpm dev`로 라이트·다크 양쪽 시각 확인. 색은 동일 토큰에서 나오므로 대비는 구조적으로 보존.

---

## File Structure

**PR-1에서 생성/변경:**
- Modify `app/globals.css` — 5색을 `@theme`으로 승격, `@utility leaf-bullet`/`stem` 정의, `@keyframes sprout` + 스태거 이전, `.prose` 스코프 신설(현 전역 요소 층은 유지).
- Create `shared/lib/cn.ts` — `cn()` 헬퍼(clsx+tailwind-merge).

**PR-2~4에서 각 컴포넌트:** 대응 `*.module.css` 삭제 + TSX의 `import styles` 제거 + `className={styles.x}` → 유틸리티 문자열/`cn(...)`.

---

## Task 1 (PR-1): 토큰 승격 · cn 헬퍼 · 유지 CSS 층 정비

**Files:**
- Modify: `app/globals.css`
- Create: `shared/lib/cn.ts`
- Modify: `views/post-page/PostView.tsx:54` (`styles.body` → `prose`, 이 파일의 나머지 `styles.*`는 Task 4에서 처리하므로 이 태스크에선 `.body`만 `.prose`로 연결)
- Modify: `views/post-page/PostView.module.css` (`.body*` 규칙 삭제 — `.prose`로 이전됨; 나머지 `.layout/.h1` 등은 Task 4까지 잔존)

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` — `@/shared/lib/cn`. 이후 모든 태스크가 외부 className 병합에 사용.
- Produces: 유틸리티 `bg-paper text-ink text-moss text-stone border-line bg-panel bg-moss-soft`, `max-w-measure max-w-reading`, `@utility` 클래스 `leaf-bullet`·`sprout-item`, `.prose` 스코프. (프로토타입의 `stem` 패턴은 현행 module엔 없어 정의하지 않음 — 전환 중 필요하면 그때 추가.)

- [ ] **Step 1: clsx·tailwind-merge 설치**

Run:
```bash
pnpm add clsx tailwind-merge
```
Expected: `package.json` dependencies에 두 패키지 추가, `pnpm-lock.yaml` 갱신.

- [ ] **Step 2: cn 헬퍼 작성**

Create `shared/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 유틸리티 클래스 병합 — 조건부 조합(clsx) 후 충돌 해소(tailwind-merge).
// 외부 className이 내부 기본값을 이기도록: cn("text-stone", className).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: cn 단위 테스트 작성 (실패 확인용)**

Create `shared/lib/cn.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("조건부 클래스를 결합한다", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("뒤에 온 유틸리티가 충돌을 이긴다", () => {
    expect(cn("text-stone", "text-ink")).toBe("text-ink");
  });
});
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pnpm test -- shared/lib/cn.test.ts`
Expected: 2 passed. (구현이 이미 있으므로 바로 PASS — 이 헬퍼는 표준 조합이라 red-green 대신 회귀 방지 목적.)

- [ ] **Step 5: globals.css — 5색을 `@theme`으로 승격**

`app/globals.css`에서 `@theme { ... }` 블록 **안**에 색 토큰을 추가한다(기존 `--font-*`/`--text-*`/`--radius-*` 옆). 그리고 기존 `:root { --paper: ...; }`의 **색 7줄을 삭제**한다(`color-scheme`/`--masthead-h` 등 비색상 줄과 `:root[data-theme]` 토글 블록은 유지).

`@theme` 블록에 추가:
```css
  /* 브랜드 5색 + 파생 2색 (design.md §2.1) — @theme 승격으로 bg-*/text-*/border-* 생성.
     light-dark() 유지: @theme inline 금지(사용 지점 color-scheme를 따라가야 함). */
  --color-paper: light-dark(#f4f5ee, #14180f);
  --color-ink: light-dark(#232a22, #e7eadf);
  --color-moss: light-dark(#4f6442, #9bbe84);
  --color-stone: light-dark(#6b7163, #9aa08f);
  --color-line: light-dark(#e2e3da, #2b3226);
  --color-panel: light-dark(rgba(35, 42, 34, 0.045), rgba(231, 234, 223, 0.05));
  --color-moss-soft: light-dark(rgba(79, 100, 66, 0.1), rgba(155, 190, 132, 0.14));

  /* 읽기 컬럼 폭 — max-w-measure / max-w-reading 유틸 생성 */
  --container-measure: var(--measure);
  --container-reading: var(--reading);
```

`:root`에서 삭제할 7줄:
```css
  --paper: light-dark(#f4f5ee, #14180f);
  --ink: light-dark(#232a22, #e7eadf);
  --moss: light-dark(#4f6442, #9bbe84);
  --stone: light-dark(#6b7163, #9aa08f);
  --line: light-dark(#e2e3da, #2b3226);
  --panel: light-dark(rgba(35, 42, 34, 0.045), rgba(231, 234, 223, 0.05));
  --moss-soft: light-dark(rgba(79, 100, 66, 0.1), rgba(155, 190, 132, 0.14));
```
> 주의: `:root`의 `color-scheme: light dark;`, `--panel`을 쓰는 다른 줄은 두지 말 것 — 색 정의만 옮기고, `:root { color-scheme: light dark; }`는 남긴다.

- [ ] **Step 6: globals.css 유지층의 토큰 참조를 `--color-*`로 갱신**

`app/globals.css` 전체에서 색 토큰 참조를 개명한다(점검 시 18곳, 전부 이 파일). 정확 치환:
- `var(--paper)` → `var(--color-paper)`
- `var(--ink)` → `var(--color-ink)`
- `var(--moss)` → `var(--color-moss)`
- `var(--stone)` → `var(--color-stone)`
- `var(--line)` → `var(--color-line)`
- `var(--panel)` → `var(--color-panel)`
- `var(--moss-soft)` → `var(--color-moss-soft)`

대상 위치(현행): `body`(background/color), `a`(color), `:focus-visible`(outline), `.leaf-bullet li::before`(background), `pre`(background/border), `:not(pre) > code`(background), `pre[data-language]::after`(color/background/border), `table`/`th,td`(border), `thead th`(color).

- [ ] **Step 7: globals.css — 잎 불릿을 `@utility`로 승격**

기존 전역 `.leaf-bullet { ... }` / `.leaf-bullet li { ... }` / `.leaf-bullet li::before { ... }` 3블록을 `@utility`로 바꾼다(중첩 셀렉터 포함 가능). `app/globals.css`의 해당 블록을 아래로 교체:
```css
/* 잎 모양 불릿 — 본문 리스트 (design.md §3). @utility로 승격해 JSX/`.prose`에서 재사용 */
@utility leaf-bullet {
  list-style: none;
  padding-left: 1.4em;
  & li {
    position: relative;
    margin: 0.4em 0;
  }
  & li::before {
    content: "";
    position: absolute;
    left: -1.1em;
    top: 0.62em;
    width: 0.5em;
    height: 0.5em;
    background: var(--color-moss);
    border-radius: 50% 0 50% 50%;
    transform: rotate(45deg);
  }
}
```

- [ ] **Step 8: globals.css — `sprout` 모션 이전 + `@utility` 스태거**

`entities/post/ui/PostList.module.css`의 `@media (prefers-reduced-motion: no-preference)` 블록(`.post` 애니메이션 + `nth-child` 딜레이 + `@keyframes sprout`)을 globals로 이전한다. `app/globals.css` 하단에 추가:
```css
/* 잎 등장 모션 (design.md §2.6) — 목록 아이템 스태거. module 해시 대신 @utility로 소유 */
@keyframes sprout {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: no-preference) {
  @utility sprout-item {
    animation: sprout 0.5s var(--ease-sprout) both;
    &:nth-child(1) {
      animation-delay: 0.04s;
    }
    &:nth-child(2) {
      animation-delay: 0.1s;
    }
    &:nth-child(3) {
      animation-delay: 0.16s;
    }
    &:nth-child(4) {
      animation-delay: 0.22s;
    }
  }
}
```
> `PostList.module.css`에서 이 모션 블록은 삭제하되, 나머지 규칙(`.post` 레이아웃 등)은 Task 4의 PostList 전환까지 잔존. 이 태스크에선 `.post`에 `sprout-item` 클래스를 아직 붙이지 않는다(Task 4에서 처리) — 즉 PR-1 종료 시 목록 모션이 잠시 빠질 수 있음. 이를 피하려면 PostList 전환을 PR-1에 합치거나, 이 스텝의 삭제를 Task 4로 미룬다. **결정: 이 스텝에서는 globals에 `@keyframes`/`sprout-item`만 추가하고, `PostList.module.css`의 모션 블록 삭제와 클래스 부착은 Task 4에서 함께 수행**(시각 무회귀 유지).

- [ ] **Step 9: globals.css — `.prose` 스코프 신설**

`views/post-page/PostView.module.css`의 `.body*` 규칙(라인 58~151)을 `.prose`로 이전한다. `app/globals.css`에 추가(전역 `pre`/`code`/`table` 층과 **중복되는 pre/code 선언은 전역 층에 이미 있으므로 `.prose`에선 본문 고유 규칙만** 남긴다 — h2 ¶모티프, h3, blockquote, ul 잎불릿, ol, figure, p 간격):
```css
/* MDX 본문 스코프 (design.md §4.4) — 전역 pre/code/table 층 위에 본문 고유 규칙만 */
.prose p {
  margin: 1.1rem 0;
}
.prose h2 {
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.4;
  margin: 2.6rem 0 0.8rem;
}
.prose h2::before {
  content: "¶";
  color: var(--color-moss);
  margin-right: 0.5rem;
  font-weight: 400;
}
.prose h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 2rem 0 0.6rem;
}
.prose blockquote {
  border-left: 2px solid var(--color-moss);
  margin: 1.5rem 0;
  padding: 0.2rem 0 0.2rem 1.1rem;
  color: var(--color-stone);
}
.prose ul {
  list-style: none;
  padding-left: 1.4em;
}
.prose ul li {
  position: relative;
  margin: 0.4em 0;
}
.prose ul li::before {
  content: "";
  position: absolute;
  left: -1.1em;
  top: 0.62em;
  width: 0.5em;
  height: 0.5em;
  background: var(--color-moss);
  border-radius: 50% 0 50% 50%;
  transform: rotate(45deg);
}
.prose ol {
  padding-left: 1.4em;
}
.prose figure {
  margin: 1.8rem 0;
}
.prose figure img {
  width: 100%;
  border-radius: var(--radius-pre);
  border: 1px solid var(--color-line);
  display: block;
}
.prose figcaption {
  color: var(--color-stone);
  font-size: var(--text-sm);
  margin-top: 0.5rem;
  text-align: center;
}
.prose p code,
.prose li code {
  background: var(--color-panel);
  border-radius: var(--radius-code);
  padding: 0.08em 0.35em;
}
```
> `.body code`(font-mono/0.9em)와 `.body pre`는 전역 `pre code`/`pre`/`:not(pre)>code` 층이 이미 담당하므로 `.prose`에 재선언하지 않는다. `.body pre` 배경/테두리도 전역 `pre`와 동일 → 생략.

- [ ] **Step 10: PostView가 `.prose`를 쓰도록 연결 + module의 `.body*` 삭제**

`views/post-page/PostView.tsx:54` 변경:
```tsx
        <div className={styles.body}>
```
→
```tsx
        <div className="prose">
```
`views/post-page/PostView.module.css`에서 `.body*` 규칙(라인 58~151)을 **삭제**한다. (`.layout/.article/.tags/.h1/.byline/.dot/.hero/.tocCol` 등 나머지는 Task 4까지 잔존.)

- [ ] **Step 11: 빌드·린트·테스트·시각 검증**

Run:
```bash
pnpm test && pnpm lint && pnpm build
```
Expected: 모두 성공. 이어서 `pnpm dev` 후 글 상세 페이지에서 본문(h2 ¶·잎불릿·blockquote·코드칩·표)이 라이트/다크 양쪽에서 이전과 동일한지 눈으로 확인. 목록 스태거 모션은 Task 4까지 유지(이 PR에선 손대지 않음).

- [ ] **Step 12: 커밋 (사용자 승인 후)**

```bash
git add app/globals.css shared/lib/cn.ts shared/lib/cn.test.ts \
  views/post-page/PostView.tsx views/post-page/PostView.module.css package.json pnpm-lock.yaml
git commit -m "refactor: 5색 토큰 @theme 승격·cn 헬퍼·prose 스코프 정비"
```

---

## Task 2 (PR-2): `shared` 슬라이스 전환 (4개)

**Files:**
- Modify+Delete: `shared/theme/ThemeToggle.tsx` / `.module.css`
- Modify+Delete: `shared/ui/Eyebrow.tsx` / `.module.css`
- Modify+Delete: `shared/ui/TagChip.tsx` / `.module.css`
- Modify+Delete: `shared/ui/EmptyState.tsx` / `.module.css`

**Interfaces:**
- Consumes: `cn` from `@/shared/lib/cn` (Task 1). 유틸리티 토큰 클래스(Task 1).
- Produces: 외부 className 병합 관례 — `Eyebrow`/`TagChip` 등은 `cn(<기본 유틸>, className)`.

**전환 레시피 (모든 컴포넌트 공통):**
1. 대응 `.module.css`를 읽어 각 클래스의 선언을 유틸리티로 매핑(색→`text-*/bg-*/border-*`, `--text-*`→`text-*`, `--radius-pill`→`rounded-pill` 등).
2. `import styles from "./X.module.css"` 삭제.
3. `className={styles.foo}` → `className="<유틸>"`. 외부 className을 받는 경우 `className={cn("<유틸>", className)}`.
4. 표현 불가(가상요소·자식선택자)는 임의 variant(`[&::before]:…`, `[&>li]:…`) 또는 Task 1의 `@utility`.
5. `.module.css` 파일 삭제.

- [ ] **Step 1: ThemeToggle 전환 (워크드 예시 — 이 패턴을 나머지에 적용)**

`shared/theme/ThemeToggle.module.css`(`.toggle`: stone·transparent·border0·`rounded-pill`·padding0.25·inline-flex·center·color transition, `.toggle:hover` ink; `.icon`: 1.2rem 사각).

`shared/theme/ThemeToggle.tsx` 변경:
- 라인 4 `import styles from "./ThemeToggle.module.css";` 삭제.
- 라인 50 `className={styles.toggle}` →
  ```tsx
  className="inline-flex cursor-pointer items-center justify-center rounded-pill border-0 bg-transparent p-1 text-stone transition-colors hover:text-ink"
  ```
- 라인 65·81 두 곳 `className={styles.icon}` → `className="h-[1.2rem] w-[1.2rem]"`.

그다음 `rm shared/theme/ThemeToggle.module.css`.

- [ ] **Step 2: Eyebrow 전환 (cn 병합 예시)**

`shared/ui/Eyebrow.module.css`(`.eyebrow`: moss·500·자간 .02em, inline-block 등 — 실제 선언대로 매핑).

`shared/ui/Eyebrow.tsx` 변경:
```tsx
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

// moss·500·자간으로 구분되는 라벨. 사용처에서 className으로 여백만 얹는다.
export function Eyebrow({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={cn("text-moss font-medium tracking-[0.02em]", className)} {...rest}>
      {children}
    </span>
  );
}
```
> 실제 `.eyebrow` 선언(폰트 크기/대문자 여부 등)을 `.module.css`에서 확인해 누락 없이 반영한 뒤 `rm shared/ui/Eyebrow.module.css`.

- [ ] **Step 3: TagChip 전환**

`shared/ui/TagChip.module.css`(`.tag`: moss 텍스트 + `--moss-soft` 배경 + pill)를 매핑. `Eyebrow`와 동일하게 `cn("text-moss bg-moss-soft rounded-pill <padding/size>", className)` 형태로. `import styles` 제거, `[styles.tag, className].join` → `cn(...)`. 이후 `rm shared/ui/TagChip.module.css`.

- [ ] **Step 4: EmptyState 전환**

`shared/ui/EmptyState.module.css`를 읽어 매핑(잎1 + eyebrow + 메시지 + 액션 링크 레이아웃, `role` 주입 유지). 유틸리티로 전환, `import styles` 제거, `rm shared/ui/EmptyState.module.css`.

- [ ] **Step 5: 검증**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: 성공. `pnpm dev`로 토글(hover 포함)·태그칩·eyebrow·빈 상태를 라이트/다크 확인. `git status`에 `shared/**/*.module.css` 4개가 삭제로 표시되는지 확인.

- [ ] **Step 6: 커밋 (사용자 승인 후)**

```bash
git add -A shared/
git commit -m "refactor: shared 프리미티브 CSS Modules→Tailwind 유틸리티"
```

---

## Task 3 (PR-3): `widgets` 슬라이스 전환 (7개)

**Files (각 `.tsx` 수정 + `.module.css` 삭제):**
- `widgets/footer/Footer` · `widgets/masthead/Masthead` · `widgets/pagination/Pager` · `widgets/related/Related` · `widgets/series-card/SeriesCard` · `widgets/series-nav/SeriesNav` · `widgets/toc/Toc`

**Interfaces:**
- Consumes: `cn`(Task 1), 토큰 유틸리티, `.wrap`(globals 유지 — Footer/Masthead가 `${styles.x} wrap` 형태로 병용 중이므로 `cn("<유틸>", "wrap")` 또는 문자열로 유지).

**공통 레시피:** Task 2와 동일(모듈 읽기→매핑→import 제거→className 치환→파일 삭제). 파일별 주의:

- [ ] **Step 1: Footer 전환**

`widgets/footer/Footer.tsx:6` `className={\`${styles.footer} wrap\`}` → `className={cn("<footer 유틸>", "wrap")}`. `Footer.module.css` 매핑 후 삭제.

- [ ] **Step 2: Masthead 전환 (다중 결합 클래스)**

`widgets/masthead/Masthead.tsx`의 `${styles.masthead} wrap`(라인 27)·`${styles.nav} wrap`(라인 38) 등 결합을 `cn(...)`로. sticky 헤더·z-index는 `sticky top-0 z-[var(--z-header)]` 등 토큰 참조. `Masthead.module.css`(67줄) 전량 매핑 후 삭제.

- [ ] **Step 3: Pager 전환**

`widgets/pagination/Pager.module.css` 매핑. 현재/비활성 상태 클래스는 조건부 `cn(base, active && "<active 유틸>")`. 파일 삭제.

- [ ] **Step 4: Related 전환**

`widgets/related/Related.module.css` 매핑(관련 글 리스트). `list-style:none` 등 → 유틸 또는 `leaf-bullet`. 파일 삭제.

- [ ] **Step 5: SeriesCard 전환**

`widgets/series-card/SeriesCard.module.css` 매핑. 파일 삭제.

- [ ] **Step 6: SeriesNav 전환 (결합 클래스)**

`widgets/series-nav/SeriesNav.tsx:35` `${styles.card} ${styles.next}` → `cn(styles대체 유틸, ...)`. prev/next 방향 클래스 조건부. `SeriesNav.module.css` 매핑 후 삭제.

- [ ] **Step 7: Toc 전환 (조건부 depth 클래스)**

`widgets/toc/Toc.tsx:22` `h.depth === 3 ? styles.sub : undefined` → `cn(h.depth === 3 && "<sub 유틸>")`. 스크롤스파이 active 상태 클래스가 있으면 조건부로. `Toc.module.css`(40줄) 매핑 후 삭제.

- [ ] **Step 8: 검증**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: 성공. `pnpm dev`로 마스트헤드(sticky·토글)·푸터·페이지네이션·관련글·시리즈 카드/네비·목차(스크롤스파이 active 강조)를 라이트/다크 확인. 위젯 7개 `.module.css` 삭제 확인.

- [ ] **Step 9: 커밋 (사용자 승인 후)**

```bash
git add -A widgets/
git commit -m "refactor: widgets CSS Modules→Tailwind 유틸리티"
```

---

## Task 4 (PR-4): `views` (7) + `entities` (1) 전환 + 모션 마무리

**Files:**
- `views/home/HomeView` · `views/posts/PostsView` · `views/series/SeriesListView` · `views/series/SeriesDetailView` · `views/about/AboutView` · `views/about/components/About` · `views/post-page/PostView`(잔여 `.layout` 등) · `entities/post/ui/PostList`(+`PostListItem.tsx`)

**Interfaces:**
- Consumes: `cn`(Task 1), `sprout-item`/`leaf-bullet`(Task 1 `@utility`), `.prose`(이미 연결됨), 토큰 유틸리티.

**공통 레시피:** Task 2와 동일. 파일별 주의:

- [ ] **Step 1: PostList 전환 + 모션 마무리 (Task 1 Step 8 연계)**

`entities/post/ui/PostList.module.css`에서 `@media(prefers-reduced-motion)` 모션 블록을 **삭제**(globals로 이전 완료). `PostListItem.tsx:47` `${styles.thumb} ${styles.thumbEmpty}` → `cn(...)`. 목록 아이템 요소에 `sprout-item` 클래스 부착(기존 `.post`의 애니메이션을 대체). 나머지 레이아웃/thumb 규칙 유틸 매핑. `PostList.module.css` 삭제.
> 검증 시 목록 진입 스태거 모션이 이전과 동일하게 재현되는지, `prefers-reduced-motion: reduce`에서 애니메이션이 꺼지는지 확인.

- [ ] **Step 2: PostView 잔여 전환**

`views/post-page/PostView.tsx`의 남은 `styles.*`(`.layout` grid 3열·`.article`·`.tags`·`.h1` clamp·`.byline`·`.dot`·`.hero`·`.tocCol`) → 유틸리티. grid 3열은 `grid grid-cols-[1fr_min(var(--container-reading),100%)_1fr]` 등. `.h1`의 `clamp(var(--text-2xl),5vw,var(--text-3xl))`는 임의값 `text-[clamp(...)]` 또는 유지 유틸. `import styles` 제거, `PostView.module.css` 삭제.

- [ ] **Step 3: HomeView 전환** — `HomeView.module.css` 매핑, `.wrap` 병용 유지, 삭제.
- [ ] **Step 4: PostsView 전환** — `PostsView.module.css` 매핑, 삭제.
- [ ] **Step 5: SeriesListView 전환** — 매핑, 삭제.
- [ ] **Step 6: SeriesDetailView 전환** — 매핑, 삭제.
- [ ] **Step 7: AboutView + About 전환** — `AboutView.module.css`(19줄, `.body h2` ¶모티프 등 — 본문형이면 `.prose` 재사용 검토) + `About.module.css`(프로필/프로젝트 그리드) 매핑, 두 파일 삭제.

- [ ] **Step 8: 최종 검증 — module.css 0개**

Run:
```bash
/usr/bin/find . -path ./node_modules -prune -o -path ./.claude -prune -o -name '*.module.css' -print
pnpm test && pnpm lint && pnpm build
```
Expected: `find` 출력 **비어 있음**(worktree 제외). 빌드·테스트·린트 성공. `pnpm dev`로 홈·목록·시리즈(목록/상세)·About·글 상세 전 페이지를 라이트/다크 확인.

- [ ] **Step 9: 커밋 (사용자 승인 후)**

```bash
git add -A views/ entities/
git commit -m "refactor: views·entities CSS Modules→Tailwind 유틸리티 전환 완료"
```

---

## Task 5: 문서 드리프트 해소 (`tech-stack.md §2.4`)

**Files:** Modify `dong-docs/prepare/tech-stack.md`

- [ ] **Step 1: §2.4 결정 기록**

`dong-docs/prepare/tech-stack.md §2.4`에 `대안 → 선택 → 이유` 3단으로 추가: "**컴포넌트 스타일 = 유틸리티 우선 Tailwind. MDX 본문·잎 모티프·모션만 `globals.css` 얇은 층(`.prose`/`@utility`). CSS Modules 폐지.**" 대안(CSS Modules 유지)·선택(유틸리티 우선)·이유(DX·토큰 강제·생태계 정합·드리프트 해소, 프로토타입 vanilla CSS를 유틸+얇은 층으로 재정착). 스택 표의 "스타일" 행 주석도 갱신. 이 플랜/스펙 링크.

- [ ] **Step 2: 상태 표 갱신 & 커밋 (사용자 승인 후)**

스펙 문서 상태를 "구현 완료"로 갱신.
```bash
git add dong-docs/prepare/tech-stack.md dong-docs/specs/2026-07-03-tailwind-migration-design.md
git commit -m "docs: Tailwind 유틸리티 우선 결정 tech-stack 반영"
```

---

## 완료 기준 (스펙 §6 대응)

- [ ] `*.module.css` 0개(worktree 제외) — Task 4 Step 8로 검증.
- [ ] 5색·파생 색이 `@theme`에서 유틸리티로 생성, 컴포넌트가 토큰 유틸리티만 사용 — Task 1·2·3·4.
- [ ] MDX 본문·모티프·모션이 `.prose`/`@utility`로 동작, 시각 무회귀(라이트/다크) — 각 태스크 검증 스텝.
- [ ] 빌드·테스트·린트 green — 각 태스크 검증 스텝.
- [ ] `tech-stack.md §2.4` 결정 반영 — Task 5.
