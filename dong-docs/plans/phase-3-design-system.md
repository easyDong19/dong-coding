# Phase 3 — 디자인 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **skill:** 컴포넌트·시각 작업은 **frontend-design skill** 참고(Task 0.2에서 추가됨). 단, `design.md`가 SSOT이며 skill이 토큰·5색 규칙을 덮어쓰지 않는다.
> **참조:** 시각 해부는 `design.md §2~6`, 마크업 레퍼런스는 `dong-docs/prototype/index.html`. **재현이 아니라 준수** — 프로토타입 섹션을 대응시켜 옮긴다.

**Goal:** `design.md`의 토큰(색·타입스케일·간격·radius·모션)을 `@theme`에 확정하고, 폰트 셀프호스트·잎 모티프 SVG·기본 컴포넌트·다크 테마 토글(FOUC 방지 포함)을 세운다. 데이터에 의존하지 않으므로 **Phase 2와 병렬** 가능.

**Architecture:** 토큰은 `app/globals.css`(`@theme`). 폰트는 `next/font/local`(Pretendard) + `next/font/google`(JetBrains Mono), `app/layout.tsx`에서 주입. 잎 SVG는 `shared/ui`에서 `<symbol>` 1회 정의. 테마 해석 로직만 순수 함수(`shared/theme/resolve-theme.ts`)로 분리해 테스트, DOM 적용은 얇은 클라이언트 컴포넌트.

**Tech Stack:** Tailwind v4 `@theme`, next/font, Vitest(테마 해석만).

## Global Constraints

`00-roadmap.md §2` 적용. 특히 **5색만·투명도 파생·`light-dark()`**, **Pretendard 한 종(코드만 mono)**, **7단계 타입스케일**, **rem 단위·320px 무깨짐**, **`prefers-reduced-motion` 가드**, **`:focus-visible` moss 2px**.

---

### Task 3.1: 폰트 셀프호스트 (Pretendard + JetBrains Mono)

**Files:**
- Create: `app/fonts.ts`, `shared/fonts/PretendardVariable.woff2`(에셋 배치)
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `--sans`/`--mono`에 연결될 `next/font` 변수 클래스. `tech-stack §6.7`(Variable woff2 1개로 400·500·600·700 커버).

- [ ] **Step 1: Pretendard Variable woff2 배치 + next/font/local**

```ts
// app/fonts.ts
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

export const pretendard = localFont({
  src: "../shared/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "400 700",
});
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
```
> woff2 파일은 Pretendard 릴리스에서 받아 `shared/fonts/`에 커밋(`tech-stack §6.7`: 번들에 안 들어가고 정적 에셋으로 서빙).

- [ ] **Step 2: layout에 변수 클래스 부착**

```tsx
// app/layout.tsx (html 태그)
import { pretendard, jetbrains } from "./fonts";
// <html lang="ko" className={`${pretendard.variable} ${jetbrains.variable}`}>
```

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm dev` → 본문이 Pretendard로 렌더(폴백 system-ui 아님) 확인.
```bash
git add -A && git commit -m "feat: self-host Pretendard + JetBrains Mono via next/font"
```

---

### Task 3.2: 토큰 확정 — 타입스케일·간격·radius·모션

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `--text-xs..3xl`(7단계), `--measure`/`--gutter`/reading 폭, radius, 모션 토큰. Phase 4 컴포넌트가 `var(--…)`로 참조.

- [ ] **Step 1: `@theme`에 타입스케일·폰트 매핑 (design.md §2.2)**

```css
@theme {
  --font-sans: "Pretendard", var(--font-sans), system-ui, sans-serif;
  --font-mono: "JetBrains Mono", var(--font-mono), ui-monospace, monospace;

  --text-xs: 0.75rem;   --text-sm: 0.875rem;  --text-base: 1rem;
  --text-lg: 1.25rem;   --text-xl: 1.5rem;    --text-2xl: 1.875rem;
  --text-3xl: 2.25rem;

  --measure: 39rem;     /* ≥768px에서 48rem (미디어쿼리) */
  --gutter: clamp(1.25rem, 5vw, 2.5rem);
}
```

- [ ] **Step 2: 간격·radius·테두리·모션 (design.md §2.3~2.6)**

`--reading: 43rem`(≥768), radius(인라인 5px·pre 10px·pill 999px·focus 2px), 헤어라인 `1px solid var(--line)`, sprout 모션은 **`@media (prefers-reduced-motion: no-preference)` 가드 안에서만** 정의. (프로토타입 `index.html`의 대응 CSS를 토큰으로 옮김)

- [ ] **Step 3: 반응형 브레이크포인트 (design.md §2.7)**

`≥768px`에서 `--measure: 48rem`. 가로 오버플로 방지 유틸(코드블록/표 `overflow-x:auto`, 긴 URL `overflow-wrap:anywhere`, 미디어 `max-width:100%`).

- [ ] **Step 4: 검증 — 320px 무깨짐**

Run: `pnpm dev` → 브라우저 320px에서 `document.documentElement.scrollWidth <= clientWidth`(가로 스크롤 0) 확인(`design.md §2.7` 검증 기준).

- [ ] **Step 5: 커밋**

```bash
git add -A && git commit -m "feat: finalize design tokens (type scale, spacing, radius, motion)"
```

---

### Task 3.3: 잎 모티프 SVG + 기본 프리미티브

**Files:**
- Create: `shared/ui/LeafSymbols.tsx`(`#leaf` outline·`#leaf-fill`), `shared/ui/Eyebrow.tsx`, `shared/ui/TagChip.tsx`, `shared/ui/EmptyState.tsx`
- Modify: `app/layout.tsx`(LeafSymbols 1회 마운트)

**Interfaces:**
- Produces:
  - `<LeafSymbols />` — `<symbol id="leaf">`·`<symbol id="leaf-fill">` 1회 정의, `aria-hidden`.
  - `Eyebrow` — Pretendard·moss·500·자간 .02em(서체 전환 없음, `design.md §2.2`).
  - `TagChip` — moss 텍스트 + `--moss-soft` + pill.
  - `EmptyState` — 잎1 + eyebrow + 메시지 + 액션 링크. `role` 주입(status/alert). `design.md §4.11`.

- [ ] **Step 1: 잎 심볼 정의**

`design.md §3` + 프로토타입 `#leaf`/`#leaf-fill` SVG를 `<symbol>`로 옮기고 layout 최상단에 `<LeafSymbols />` 마운트, `<use href="#leaf">`로 재사용.

- [ ] **Step 2: Eyebrow·TagChip·EmptyState 프리미티브**

각 컴포넌트를 토큰(`var(--…)`)만으로 작성(hex 하드코딩 금지). `EmptyState`는 `role` prop(`"status" | "alert"`)과 포커스 이동 지원.

- [ ] **Step 3: 검증 + 커밋**

임시 페이지에 세 프리미티브 렌더 → design.md 대비 시각 확인.
```bash
git add -A && git commit -m "feat: leaf symbols + Eyebrow/TagChip/EmptyState primitives"
```

---

### Task 3.4: 테마 해석 순수 함수 (TDD — test-plan §5.2)

**Files:**
- Create: `shared/theme/resolve-theme.ts`, `shared/theme/resolve-theme.test.ts`

**Interfaces:**
- Produces: `resolveTheme(saved: string | null, os: "light" | "dark" | null): "light" | "dark" | "system"`
  - 저장값 유효(`light`/`dark`) → 저장값. 없거나 깨진 값 → os. os도 null → `"system"`(브라우저 `light dark` 위임). `design.md §2.1` 우선순위.
- Consumes: 없음.

- [ ] **Step 1: 실패 테스트 (§5.2 케이스 1~4)**

```ts
// shared/theme/resolve-theme.test.ts
import { expect, test } from "vitest";
import { resolveTheme } from "./resolve-theme";

test("저장값 있으면 OS 무시하고 저장값 우선", () => {
  expect(resolveTheme("dark", "light")).toBe("dark");
});
test("저장값 없으면 OS 따름", () => {
  expect(resolveTheme(null, "dark")).toBe("dark");
});
test("깨진 저장값 → OS 폴백", () => {
  expect(resolveTheme("banana", "light")).toBe("light");
});
test("둘 다 없음 → system(브라우저 위임)", () => {
  expect(resolveTheme(null, null)).toBe("system");
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test shared/theme` → FAIL.

- [ ] **Step 3: 구현**

```ts
// shared/theme/resolve-theme.ts
export function resolveTheme(
  saved: string | null,
  os: "light" | "dark" | null,
): "light" | "dark" | "system" {
  if (saved === "light" || saved === "dark") return saved;
  if (os === "light" || os === "dark") return os;
  return "system";
}
```

- [ ] **Step 4: 통과 + 커밋**

```bash
git add -A && git commit -m "feat: resolveTheme (saved > OS > system) test-plan §5.2"
```

---

### Task 3.5: 테마 토글 + FOUC 방지 스크립트

**Files:**
- Create: `shared/theme/ThemeToggle.tsx`, `shared/theme/theme-init.ts`(인라인 스크립트 문자열)
- Modify: `app/layout.tsx`(head 인라인 스크립트)

**Interfaces:**
- Consumes: `resolveTheme`(개념 공유; 인라인 스크립트는 렌더 전 실행되므로 최소 JS로 동일 우선순위 구현), `localStorage['dc-theme']`.
- Produces: `<html data-theme>` 세팅 + 토글 UI(`aria-pressed`/`aria-label`).

- [ ] **Step 1: FOUC 방지 blocking 스크립트 (design.md §2.1)**

```html
<script>(function(){try{var t=localStorage.getItem('dc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
```
`app/layout.tsx`의 `<head>` 최상단에 `dangerouslySetInnerHTML`로 주입. `<html>`에 `suppressHydrationWarning`.

- [ ] **Step 2: ThemeToggle — 저장·토글**

클릭 시 `localStorage['dc-theme']` 기록 + `data-theme` 반영. 저장값 우선 > OS(`design.md §2.1`). `aria-pressed` 또는 `aria-label` 부여.

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm dev` → 토글 후 새로고침에도 모드 유지, 초기 로드 깜빡임 없음.
```bash
git add -A && git commit -m "feat: theme toggle with FOUC-safe inline init"
```

---

## Self-Review (Phase 3)

- **커버리지:** design.md 토큰(§2)·모티프(§3)·프리미티브(§4.11 등)·접근성(§5)·다크모드(§2.1 FOUC·영속화)·폰트(§2.5, tech-stack §6.7) 모두 태스크로 존재. 순수 로직(테마 해석 §5.2)은 TDD. ✅
- **플레이스홀더:** 시각 마크업은 "프로토타입/§ 대응해 옮김"으로 명시(design.md가 SSOT라 재현이 정당) — 빈 약속 아님. 순수 함수·인라인 스크립트는 전문 제공. ✅
- **타입 일관성:** `resolveTheme` 반환 유니온(`light|dark|system`)이 ThemeToggle·layout에서 동일하게 소비. 토큰명(`--text-*`, `--measure`, `--moss-soft`)이 Phase 4에서 재사용. ✅

## 완료 기준

- `pnpm test`(테마 해석 포함) 그린, 320px 무깨짐, 다크 토글 영속·무플래시.
- 다음: `phase-4-pages.md`.
