# Phase 0 — 프로젝트 셋업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next 16 + TypeScript + Tailwind v4 + Velite 스켈레톤과 Vitest를 세우고, 경량 FSD 폴더 골격까지 만들어 이후 페이즈가 바로 코드를 얹을 수 있는 부트스트랩 상태를 만든다.

**Architecture:** 그린필드. `git init`부터 시작. `app/`은 얇게, `entities/`·`widgets/`·`shared/`·`views/` 빈 골격만. Velite는 별도 빌드 스텝으로 분리(sharp 충돌 회피).

**Tech Stack:** Next.js 16(App Router·Turbopack·SSG), TypeScript, pnpm, Tailwind CSS v4, shadcn/ui, Velite, Vitest.

## Global Constraints

`00-roadmap.md §2`를 그대로 적용한다. 이 페이즈에서 특히:
- 빌드 스텝 분리: `"build": "velite --clean && next build"`.
- `.velite/`는 gitignore, 접근은 entities public API 경유(골격만 이 페이즈에서).
- **패키지 매니저는 pnpm 전용** — `npm`/`yarn` 금지. 모든 설치는 `pnpm add`, 실행은 `pnpm <script>`. `pnpm-lock.yaml`만 커밋하고 `package.json`에 `"packageManager"` 필드로 고정. TypeScript, ESLint 9 flat + Prettier.

---

## ⚠️ 사용자 개입 지점 (Task 0.2)

**이 페이즈에는 사용자가 직접 수행하는 수동 단계가 있다.** Task 0.2에서 **사용자가 관련 Claude Code skills를 수동으로 추가**한다. 에이전트는 Task 0.1을 끝낸 뒤 **Task 0.2에서 멈추고 사용자에게 넘긴다.** 사용자가 skills 추가를 마치고 "정리해줘"라고 지시하면 Task 0.3(정리)로 진행한다.

---

### Task 0.1: 저장소 초기화 + Next 16 스캐폴딩

**Files:**
- Create: `.gitignore`, `package.json`, `tsconfig.json`, `next.config.ts`, `.git/`

**Interfaces:**
- Produces: pnpm 워크스페이스 루트, `pnpm dev`/`pnpm build` 스크립트 골격(다음 태스크에서 velite 스텝 추가).

- [ ] **Step 1: git 저장소 초기화**

Run:
```bash
cd /Users/easydong/woodie/dong-coding && git init && printf "node_modules\n.next\n.velite\n.DS_Store\n*.log\n.env*.local\n" > .gitignore
```
Expected: `.git/` 생성, `.gitignore` 작성.

- [ ] **Step 2: Next 16 앱 스캐폴딩(pnpm, TS, App Router)**

Run:
```bash
pnpm create next-app@latest . --ts --app --no-src-dir --import-alias "@/*" --use-pnpm --eslint --no-tailwind --turbopack
```
- `--no-tailwind`: Tailwind v4는 Task 0.4에서 CSS-first로 직접 설치(create-next-app의 v3/v4 기본과 무관하게 우리 방식으로).
- 기존 파일 유지 프롬프트가 뜨면 `dong-docs/`는 보존.

Expected: `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, **`pnpm-lock.yaml`** 생성. `package-lock.json`·`yarn.lock`이 생겼다면 삭제하고 `pnpm install`로 재생성. `pnpm dev`로 기본 페이지 확인 가능.

- [ ] **Step 3: pnpm 고정 + 첫 커밋**

`package.json`에 `"packageManager"` 필드를 박아 pnpm을 강제한다(Corepack·CI가 다른 매니저를 못 쓰게):
```bash
pnpm pkg set packageManager="pnpm@$(pnpm -v)"
git add -A && git commit -m "chore: bootstrap Next 16 app with pnpm + TS"
```
Expected: `package.json`에 `"packageManager": "pnpm@11.x"`. `pnpm-lock.yaml`만 스테이징됨(다른 lock 파일 없음).

---

### Task 0.2: 🧑 사용자 수동 — Claude Code skills 추가

> **이 태스크는 사용자가 직접 수행한다.** 에이전트는 여기서 실행을 멈추고, 아래 안내만 출력한 뒤 사용자 입력을 기다린다.

**Files:** (없음 — 사용자의 Claude Code 환경 설정)

- [ ] **Step 1: (사용자) 프로젝트에 필요한 skills를 수동으로 추가**

사용자가 이 프로젝트 스택에 맞는 skills를 직접 골라 추가한다. 참고로 이 스택과 직접 맞닿는 후보:
- **zod** — Velite 스키마가 Zod 기반(`content-plan §2`, `tech-stack §3.1.1`의 refine 규칙). Phase 1에서 바로 쓰임.
- **frontend-design** — 디자인 시스템·컴포넌트(Phase 3~4).
- 그 외 사용자가 워크플로에 필요하다고 판단하는 skills.

> 에이전트는 어떤 skills를 넣을지 **대신 결정하지 않는다.** 후보만 제시하고 사용자의 선택을 기다린다.

- [ ] **Step 2: (에이전트) 실행 정지 → 사용자에게 핸드오프**

에이전트 출력 예: *"Task 0.1까지 완료했습니다. Task 0.2는 skills 수동 추가 단계입니다 — 필요한 skills를 추가하신 뒤 '정리해줘'라고 알려주시면 Task 0.3(정리)로 진행하겠습니다."*

**Gate:** 사용자가 skills 추가 완료를 알리기 전까지 Task 0.3 이후로 넘어가지 않는다.

---

### Task 0.3: 🧑→🤖 사용자 지시 후 — skills 정리

> **사용자가 "정리해줘"라고 지시하면 시작.** 추가된 skills를 점검·정리한다.

**Files:** (없음 — skills/설정 점검. 필요 시 `CLAUDE.md`에 사용 규약 한 줄 추가)

- [ ] **Step 1: 추가된 skills 인벤토리 확인**

현재 세션에서 사용 가능한 skills 목록을 확인하고, 프로젝트와 무관하거나 중복되는 것, 이번 스택에 실제 도움이 되는 것을 분류한다.

- [ ] **Step 2: 정리 결과를 사용자에게 요약 보고**

각 skill이 어느 페이즈에서 쓰일지(예: zod → Phase 1, frontend-design → Phase 3~4) 매핑해 보고. 불필요한 것은 제외 제안.

- [ ] **Step 3: (선택) 프로젝트 skills 사용 규약을 `CLAUDE.md`에 기록**

이 저장소에 `CLAUDE.md`가 없으면 생성해, "Velite 스키마 작업 시 zod skill 사용" 등 규약을 한 줄로 남긴다(팀·미래 세션 컨텍스트).

```bash
git add -A && git commit -m "chore: document project skill usage"
```

> **주의:** 이 태스크의 구체 범위는 사용자가 어떤 skills를 넣었는지에 따라 달라진다. 사용자 지시가 오면 그때 실제 목록을 보고 확정한다.

---

### Task 0.4: Tailwind v4 (CSS-first) + 5색 토큰 뼈대

**Files:**
- Create: `app/globals.css`, `postcss.config.mjs`
- Modify: `app/layout.tsx`(globals.css import 확인)

**Interfaces:**
- Produces: `@theme` 안에 `design.md` 토큰이 들어갈 자리. 실제 값 채움은 Phase 3. 여기선 **빌드가 되는 최소 뼈대**만.

- [ ] **Step 1: Tailwind v4 설치**

Run:
```bash
pnpm add -D tailwindcss @tailwindcss/postcss
```

- [ ] **Step 2: postcss.config.mjs 작성**

```js
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

- [ ] **Step 3: globals.css에 5색 토큰 뼈대 + import**

`design.md §2.1`의 `light-dark()` 블록을 그대로 옮긴다(값은 확정본).

```css
@import "tailwindcss";

:root {
  color-scheme: light dark;
  --paper: light-dark(#F4F5EE, #14180F);
  --ink:   light-dark(#232A22, #E7EADF);
  --moss:  light-dark(#4F6442, #9BBE84);
  --stone: light-dark(#7C8275, #9AA08F);
  --line:  light-dark(#E2E3DA, #2B3226);
  --panel:     light-dark(rgba(35,42,34,.045), rgba(231,234,223,.05));
  --moss-soft: light-dark(rgba(79,100,66,.10), rgba(155,190,132,.14));
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }

body { background: var(--paper); color: var(--ink); }
```

> 타입 스케일·간격·컴포넌트 CSS는 Phase 3에서 채운다. 여기선 색 뼈대 + 빌드 확인만.

- [ ] **Step 4: 빌드로 검증**

Run: `pnpm dev` 후 페이지 로드
Expected: 배경이 `--paper`(라이트에서 미색), 콘솔 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add -A && git commit -m "feat: add Tailwind v4 CSS-first with 5-color tokens"
```

---

### Task 0.5: Velite 스켈레톤 + 빌드 스텝 분리

**Files:**
- Create: `velite.config.ts`, `content/posts/.gitkeep`, `content/series/.gitkeep`
- Modify: `package.json`(scripts), `.gitignore`(`.velite` 이미 있음 확인), `tsconfig.json`(`.velite` path alias)

**Interfaces:**
- Produces: `.velite` 생성물 + `@/.velite` alias. **스키마 본체는 Phase 1**에서. 여기선 최소 컬렉션 1개로 파이프라인이 도는지만 확인.

- [ ] **Step 1: Velite 설치**

Run: `pnpm add -D velite`

- [ ] **Step 2: 최소 velite.config.ts**

```ts
import { defineConfig, defineCollection, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s.object({
    title: s.string(),
    date: s.isodate(),
    slug: s.slug("post"),
    body: s.mdx(),
  }),
});

export default defineConfig({
  collections: { posts },
});
```

- [ ] **Step 3: package.json 스크립트 — 빌드 스텝 분리(필수)**

`tech-stack §6.4` 골격을 반영:
```json
{
  "scripts": {
    "dev": "run-p dev:*",
    "dev:content": "velite --watch",
    "dev:next": "next dev --turbopack",
    "build": "velite --clean && next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```
Run: `pnpm add -D npm-run-all` (run-p 제공).

- [ ] **Step 4: tsconfig에 `.velite` alias 추가**

`compilerOptions.paths`에:
```json
"@/.velite": ["./.velite"]
```

- [ ] **Step 5: 샘플 글 1개로 파이프라인 검증**

`content/posts/hello.mdx`:
```mdx
---
title: 첫 잎
date: 2026-07-02
---

안녕하세요.
```
Run: `pnpm velite`
Expected: `.velite/` 생성, `posts` 배열에 1개 항목. 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add -A && git commit -m "feat: add Velite skeleton with split build step"
```

---

### Task 0.6: 경량 FSD 폴더 골격 + Vitest

**Files:**
- Create: `entities/post/index.ts`, `entities/series/index.ts`, `entities/post/model/.gitkeep`, `entities/series/model/.gitkeep`, `shared/config/index.ts`, `shared/test/factories.ts`, `widgets/.gitkeep`, `views/.gitkeep`, `vitest.config.ts`
- Modify: `package.json`(test 스크립트), `tsconfig.json`(alias 확인)

**Interfaces:**
- Produces:
  - `shared/config`: `POSTS_PER_PAGE = 10`, `HOME_RECENT_COUNT = 5` 상수.
  - `shared/test/factories.ts`: `makePost(overrides?): Post`, `makeSeries(overrides?): Series` 팩토리(픽스처). 타입은 Phase 1에서 Velite가 생성 → 지금은 최소 인터페이스로 시작하고 Phase 1에서 실제 타입에 맞춘다.
  - `entities/{post,series}/index.ts`: public API 진입점(빈 export, Phase 2에서 셀렉터 재노출).

- [ ] **Step 1: Vitest 설치**

Run: `pnpm add -D vitest`

- [ ] **Step 2: vitest.config.ts (alias 공유)**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
```

- [ ] **Step 3: shared/config 상수**

```ts
// shared/config/index.ts
export const POSTS_PER_PAGE = 10;   // pages-plan §2
export const HOME_RECENT_COUNT = 5; // pages-plan §1
```

- [ ] **Step 4: 픽스처 팩토리 뼈대 + 스모크 테스트**

```ts
// shared/test/factories.ts
export type TestPost = {
  slug: string; title: string; date: string;
  draft?: boolean; tags?: string[]; series?: string; order?: number;
};
export function makePost(o: Partial<TestPost> = {}): TestPost {
  return { slug: "p", title: "T", date: "2026-01-01", ...o };
}
```
```ts
// shared/test/factories.test.ts
import { expect, test } from "vitest";
import { makePost } from "./factories";
test("makePost applies overrides", () => {
  expect(makePost({ slug: "x" }).slug).toBe("x");
});
```

- [ ] **Step 5: test 스크립트 추가 + 실행**

`package.json`에 `"test": "vitest run"`, `"test:watch": "vitest"` 추가.
Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: entities public API 빈 골격**

```ts
// entities/post/index.ts
export {}; // Phase 2에서 셀렉터 재노출
```
```ts
// entities/series/index.ts
export {};
```

- [ ] **Step 7: 커밋**

```bash
git add -A && git commit -m "chore: scaffold lightweight FSD folders + Vitest"
```

---

## Self-Review (Phase 0)

- **커버리지:** 셋업 요구(Next16·pnpm·TS·Tailwind v4·Velite 분리 빌드·Vitest·FSD 골격) 모두 태스크로 존재. skills 수동 단계(사용자 요구)는 Task 0.2/0.3에 반영. ✅
- **플레이스홀더:** Velite 스키마·토큰 값은 "Phase N에서 채움"으로 **명시적 위임**(뼈대는 실제 최소 코드 제공) — 빈 약속 아님. ✅
- **타입 일관성:** `TestPost`는 Phase 1에서 Velite 생성 타입으로 재정렬 예정임을 명시. `POSTS_PER_PAGE`·`HOME_RECENT_COUNT` 상수명은 Phase 2·4에서 재사용. ✅

## 완료 기준

- `pnpm build`(velite→next) 성공, `pnpm test` 그린, `pnpm typecheck` 통과.
- **Task 0.2에서 사용자 핸드오프가 이뤄졌고, Task 0.3 정리가 사용자 지시 후 완료됨.**
- 다음: `phase-1-content-pipeline.md`.
