# 이미지 최적화 파이프라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문·커버 이미지의 전송 바이트(Vercel 위임)와 repo 원본(빌드타임 수동)을 모두 경량화한다.

**Architecture:** `next.config.ts`의 `unoptimized` 해제로 Vercel 전송 최적화를 켜고, Velite mdx rehype 플러그인이 본문 `<img>`에 치수를 주입해 Next `<Image>`로 렌더한다. 수동 `img:optimize` 스크립트가 원본을 sharp로 리사이즈·재압축하고, 빌드 게이트가 임계치 초과 원본을 막는다.

**Tech Stack:** Next 16.2 · Velite 0.4 · sharp 0.34 · vitest(node env) · pnpm · TypeScript

## Global Constraints

- **패키지 매니저: pnpm 전용.** npm/yarn 금지.
- **신규 의존성은 `sharp@^0.34.5` (devDependency) 하나뿐.** Velite가 이미 쓰는 버전과 정렬(중복 설치 방지). rehype 플러그인의 트리 순회는 외부 패키지 없이 수동 재귀로 구현.
- **커밋 컨벤션:** `<type>: <제목>`. type 7개(`feat fix post docs style refactor chore`)만. 제목 한국어 OK·**끝에 마침표 없음**·72자 이내·**스코프 없음**. husky `commit-msg` 훅이 강제. **`--no-verify` 금지.**
- **승인 게이트(최우선):** 각 Task의 커밋 스텝은 **사용자 승인 후에만** 실행. 임의 커밋 금지. PR·머지도 동일.
- **디자인 토큰:** 새 색/폰트/임의 크기 금지. 이미지 컨테이너는 기존 브랜드 토큰(`--color-line`, `rounded-pre`)만 사용.
- **Next 코드 작성 전 문서 확인:** 이 repo의 Next 16은 학습 데이터와 다를 수 있음. Image 관련 코드 전에 `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` 와 `.../05-config/01-next-config-js/images.md` 를 읽는다.
- **작업 위치:** 워크트리 `.claude/worktrees/feat-image-optimization` (branch `feat/image-optimization`, base `dev`). 모든 경로는 이 루트 기준.

---

## File Structure

**생성:**
- `content/lib/rehype-image-dimensions.ts` — 본문 `<img>`에 width/height 주입하는 Velite rehype 플러그인(팩토리).
- `content/lib/rehype-image-dimensions.test.ts` — 위 플러그인 단위 테스트.
- `shared/mdx/post-image-props.ts` — `img` props → Next Image / native img 분기 순수 함수.
- `shared/mdx/post-image-props.test.ts` — 위 순수 함수 단위 테스트.
- `shared/mdx/PostImage.tsx` — `img` 매핑 컴포넌트(얇은 JSX, 위 순수 함수 소비).
- `scripts/lib/images.mjs` — 공유 이미지 헬퍼(walk·게이트 판정·버퍼 최적화).
- `scripts/lib/images.test.ts` — `collectOversized`·`optimizeBuffer` 테스트.
- `scripts/check-image-size.mjs` — 빌드 게이트 CLI.
- `scripts/optimize-images.mjs` — 원본 최적화 CLI.

**수정:**
- `next.config.ts` — `images: { unoptimized: true }` 제거.
- `velite.config.ts` — `rehypeImageDimensions` import·등록.
- `views/post-page/lib/mdx-components.tsx` — `img: PostImage` 매핑 추가.
- `package.json` — `sharp` devDep, `img:optimize` 스크립트, `build`에 게이트 prepend.

---

## Task 1: sharp 추가 + Vercel 이미지 최적화 ON

**Files:**
- Modify: `package.json` (devDependencies)
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `sharp` 런타임 사용 가능(이후 모든 Task가 의존). `next/image` 최적화 활성.

- [ ] **Step 1: sharp를 Velite와 동일 버전으로 추가**

Run: `pnpm add -D sharp@^0.34.5`
Expected: `node_modules/.pnpm`에 `sharp@0.34.5` 단일 버전 유지(`pnpm why sharp`로 1 version 확인).

- [ ] **Step 2: `next.config.ts`에서 `unoptimized` 제거**

`next.config.ts` 전체를 아래로 교체:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: 타입·빌드 검증**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. (content에 이미지가 없어 게이트 도입 전에도 빌드 성공)

- [ ] **Step 4: 커밋** *(승인 게이트 — 사용자 승인 후)*

```bash
git add package.json pnpm-lock.yaml next.config.ts
git commit -m "chore: sharp 추가·Next 이미지 최적화 활성화"
```

---

## Task 2: 빌드 이미지 용량 게이트

**Files:**
- Create: `scripts/lib/images.mjs`
- Create: `scripts/lib/images.test.ts`
- Create: `scripts/check-image-size.mjs`
- Modify: `package.json` (build 스크립트)

**Interfaces:**
- Produces:
  - `walkImages(dir: string, exts: Set<string>): Promise<string[]>` — dir 재귀, 확장자 매칭 절대경로.
  - `collectOversized(entries: {path:string,size:number}[], limit: number): {path,size}[]` — limit 초과분 size 내림차순.
  - `GATE_EXT: Set<string>` — 게이트 대상 확장자.
  - `RASTER: Set<string>` — 최적화 대상 확장자(Task 3에서 사용).

- [ ] **Step 1: 실패 테스트 작성**

Create `scripts/lib/images.test.ts`:

```ts
import { expect, test } from "vitest";
import { collectOversized } from "./images.mjs";

test("collectOversized: limit 초과분만 size 내림차순", () => {
  const entries = [
    { path: "a", size: 100 },
    { path: "b", size: 900 },
    { path: "c", size: 500 },
  ];
  expect(collectOversized(entries, 400)).toEqual([
    { path: "b", size: 900 },
    { path: "c", size: 500 },
  ]);
});

test("collectOversized: 모두 이하 → 빈 배열", () => {
  expect(collectOversized([{ path: "a", size: 100 }], 400)).toEqual([]);
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run scripts/lib/images.test.ts`
Expected: FAIL — `Failed to resolve import "./images.mjs"`.

- [ ] **Step 3: 헬퍼 구현**

Create `scripts/lib/images.mjs`:

```js
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";

export const RASTER = new Set([".png", ".jpg", ".jpeg"]);
export const GATE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);

/** dir 하위를 재귀 walk하여 exts에 맞는 파일 절대경로 배열 반환 */
export async function walkImages(dir, exts) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out; // 디렉토리 없으면 빈 배열
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkImages(full, exts)));
    else if (exts.has(extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

/** 순수: entries 중 limit(byte) 초과분을 size 내림차순으로 반환 */
export function collectOversized(entries, limit) {
  return entries.filter((e) => e.size > limit).sort((a, b) => b.size - a.size);
}

/**
 * 버퍼를 maxWidth로 리사이즈+재압축. 결과가 원본보다 작을 때만 Buffer 반환, 아니면 null.
 * jpeg/png만 처리(그 외 포맷 → null).
 */
export async function optimizeBuffer(buffer, { maxWidth, jpegQuality }) {
  const img = sharp(buffer, { failOn: "none" });
  const meta = await img.metadata();
  const format = (meta.format ?? "").toLowerCase();
  let pipe = img;
  if (meta.width && meta.width > maxWidth) {
    pipe = pipe.resize({ width: maxWidth, withoutEnlargement: true });
  }
  if (format === "jpeg" || format === "jpg") {
    pipe = pipe.jpeg({ quality: jpegQuality, mozjpeg: true });
  } else if (format === "png") {
    pipe = pipe.png({ compressionLevel: 9, palette: true });
  } else {
    return null;
  }
  const out = await pipe.toBuffer();
  return out.length < buffer.length ? out : null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run scripts/lib/images.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: 게이트 CLI 작성**

Create `scripts/check-image-size.mjs`:

```js
import { stat } from "node:fs/promises";
import { walkImages, collectOversized, GATE_EXT } from "./lib/images.mjs";

const CONTENT = new URL("../content/", import.meta.url).pathname;
const LIMIT = 512 * 1024; // 500KB

const files = await walkImages(CONTENT, GATE_EXT);
const entries = await Promise.all(
  files.map(async (path) => ({ path, size: (await stat(path)).size })),
);
const oversized = collectOversized(entries, LIMIT);

if (oversized.length > 0) {
  console.error(`\n❌ ${oversized.length}개 이미지가 ${LIMIT / 1024}KB를 초과합니다:`);
  for (const { path, size } of oversized) {
    console.error(`   ${(size / 1024).toFixed(0)}KB  ${path.replace(CONTENT, "content/")}`);
  }
  console.error(`\n→ pnpm img:optimize 로 원본을 최적화한 뒤 다시 빌드하세요.\n`);
  process.exit(1);
}
console.log("✓ 이미지 용량 게이트 통과");
```

- [ ] **Step 6: 게이트를 build에 배선**

`package.json`의 `build` 스크립트를 교체:

```json
"build": "node scripts/check-image-size.mjs && velite --clean --strict && next build",
```

- [ ] **Step 7: 게이트 동작 확인**

Run: `node scripts/check-image-size.mjs`
Expected: `✓ 이미지 용량 게이트 통과` (현재 content 이미지 0개).

- [ ] **Step 8: 커밋** *(승인 게이트)*

```bash
git add scripts/lib/images.mjs scripts/lib/images.test.ts scripts/check-image-size.mjs package.json
git commit -m "feat: 이미지 용량 빌드 게이트 추가"
```

---

## Task 3: 원본 최적화 스크립트

**Files:**
- Modify: `scripts/lib/images.test.ts` (optimizeBuffer 테스트 추가)
- Create: `scripts/optimize-images.mjs`
- Modify: `package.json` (img:optimize 스크립트)

**Interfaces:**
- Consumes: `walkImages`, `optimizeBuffer`, `RASTER` (Task 2).
- Produces: `pnpm img:optimize` — content 원본을 제자리 최적화.

- [ ] **Step 1: 실패 테스트 추가**

`scripts/lib/images.test.ts` 상단 import에 `optimizeBuffer`·`sharp` 추가하고 아래 테스트 append:

```ts
import sharp from "sharp";
import { optimizeBuffer } from "./images.mjs";

test("optimizeBuffer: 큰 이미지를 maxWidth로 축소하고 더 작게 만든다", async () => {
  const big = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 120, g: 80, b: 40 } },
  }).png().toBuffer();
  const out = await optimizeBuffer(big, { maxWidth: 1600, jpegQuality: 80 });
  expect(out).not.toBeNull();
  const meta = await sharp(out).metadata();
  expect(meta.width).toBe(1600);
  expect(out.length).toBeLessThan(big.length);
});

test("optimizeBuffer: 지원 밖 포맷(webp) → null", async () => {
  const webp = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).webp().toBuffer();
  expect(await optimizeBuffer(webp, { maxWidth: 1600, jpegQuality: 80 })).toBeNull();
});
```

- [ ] **Step 2: 테스트 통과 확인**

`optimizeBuffer`는 Task 2에서 이미 구현됨. 실행:
Run: `pnpm vitest run scripts/lib/images.test.ts`
Expected: PASS (4 tests). 실패 시 `optimizeBuffer` 구현 점검.

- [ ] **Step 3: 최적화 CLI 작성**

Create `scripts/optimize-images.mjs`:

```js
import { readFile, writeFile, rename } from "node:fs/promises";
import { walkImages, optimizeBuffer, RASTER } from "./lib/images.mjs";

const CONTENT = new URL("../content/", import.meta.url).pathname;
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;

const files = await walkImages(CONTENT, RASTER);
let savedTotal = 0;
for (const path of files) {
  const buffer = await readFile(path);
  const out = await optimizeBuffer(buffer, { maxWidth: MAX_WIDTH, jpegQuality: JPEG_QUALITY });
  if (!out) continue;
  const tmp = `${path}.tmp`;
  await writeFile(tmp, out);
  await rename(tmp, path); // 원자적 교체
  savedTotal += buffer.length - out.length;
  console.log(
    `  ${(buffer.length / 1024).toFixed(0)}→${(out.length / 1024).toFixed(0)}KB  ${path.replace(CONTENT, "content/")}`,
  );
}
console.log(savedTotal ? `\n✓ 총 ${(savedTotal / 1024).toFixed(0)}KB 절감` : "최적화할 이미지 없음(이미 경량)");
```

- [ ] **Step 4: img:optimize 스크립트 등록**

`package.json` scripts에 추가:

```json
"img:optimize": "node scripts/optimize-images.mjs",
```

- [ ] **Step 5: 무해 실행 확인(이미지 0개)**

Run: `pnpm img:optimize`
Expected: `최적화할 이미지 없음(이미 경량)`.

- [ ] **Step 6: 커밋** *(승인 게이트)*

```bash
git add scripts/lib/images.test.ts scripts/optimize-images.mjs package.json
git commit -m "feat: 원본 이미지 최적화 스크립트 추가"
```

---

## Task 4: 본문 이미지 치수 주입 rehype 플러그인

**Files:**
- Create: `content/lib/rehype-image-dimensions.ts`
- Create: `content/lib/rehype-image-dimensions.test.ts`
- Modify: `velite.config.ts`

**Interfaces:**
- Consumes: `sharp` (Task 1), Velite export `assets` (해시파일명 → 원본 절대경로 Map).
- Produces: `rehypeImageDimensions(options?: { resolve?: (src: string) => string | undefined })` — default export 팩토리. 반환된 transformer가 HAST의 `<img>`에 `width`/`height`(number) 주입.

**배경:** Velite의 `remarkCopyLinkedFiles`가 **remark 단계(모든 rehype보다 먼저)** 에서 본문 이미지 src를 `/static/<hash>.<ext>`로 재작성하고 `assets` 맵에 `{해시파일명 → 원본경로}`를 등록한다. 따라서 rehype 단계에서 `basename(src)`로 `assets`를 역참조하면 원본 경로를 얻는다. `resolve`를 주입 가능하게 해 테스트에서 `assets` 전역 없이 검증한다.

- [ ] **Step 1: 실패 테스트 작성**

Create `content/lib/rehype-image-dimensions.test.ts`:

```ts
import { expect, test } from "vitest";
import sharp from "sharp";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import rehypeImageDimensions from "./rehype-image-dimensions";

async function fixtureImage(w: number, h: number) {
  const dir = await mkdtemp(join(tmpdir(), "img-"));
  const path = join(dir, "pic.png");
  const buf = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).png().toBuffer();
  await writeFile(path, buf);
  return path;
}

function imgNode(src: string) {
  return { type: "element", tagName: "img", properties: { src }, children: [] };
}

test("로컬 img에 원본 width/height 주입", async () => {
  const path = await fixtureImage(640, 480);
  const node = imgNode("/static/pic-abc123.png?x#y");
  const tree = { type: "root", children: [node] };
  await rehypeImageDimensions({ resolve: () => path })(tree as never);
  expect(node.properties.width).toBe(640);
  expect(node.properties.height).toBe(480);
});

test("원격 URL은 건드리지 않음", async () => {
  const node = imgNode("https://x.com/a.png");
  const tree = { type: "root", children: [node] };
  await rehypeImageDimensions({ resolve: () => "/should/not/be/used" })(tree as never);
  expect(node.properties.width).toBeUndefined();
});

test("resolve가 못 찾으면 치수 없이 통과", async () => {
  const node = imgNode("/static/missing.png");
  const tree = { type: "root", children: [node] };
  await rehypeImageDimensions({ resolve: () => undefined })(tree as never);
  expect(node.properties.width).toBeUndefined();
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run content/lib/rehype-image-dimensions.test.ts`
Expected: FAIL — `Failed to resolve import "./rehype-image-dimensions"`.

- [ ] **Step 3: 플러그인 구현**

Create `content/lib/rehype-image-dimensions.ts`:

```ts
import sharp from "sharp";
import { basename } from "node:path";
import { assets } from "velite";

export interface RehypeImageDimensionsOptions {
  /** src(=/static/hash.ext) → 원본 절대경로. 기본은 Velite assets 맵 역참조. 테스트용 주입 지점. */
  resolve?: (src: string) => string | undefined;
}

// 외부 순회 의존성 없이 HAST를 수동 재귀하여 <img> 엘리먼트 수집
type HastNode = { type?: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };

function collectImgs(node: HastNode, out: HastNode[]): void {
  if (node.type === "element" && node.tagName === "img") out.push(node);
  if (Array.isArray(node.children)) for (const c of node.children) collectImgs(c, out);
}

const defaultResolve = (src: string): string | undefined => {
  const clean = src.split(/[?#]/)[0];        // 쿼리/해시 suffix 제거
  return assets.get(basename(clean));         // 해시파일명 → 원본 절대경로
};

export default function rehypeImageDimensions(options: RehypeImageDimensionsOptions = {}) {
  const resolve = options.resolve ?? defaultResolve;
  return async (tree: HastNode): Promise<void> => {
    const imgs: HastNode[] = [];
    collectImgs(tree, imgs);
    await Promise.all(
      imgs.map(async (node) => {
        const props = node.properties ?? {};
        const src = props.src;
        if (typeof src !== "string") return;
        if (props.width != null || props.height != null) return; // 이미 치수 있음
        if (/^https?:\/\//.test(src)) return;                     // 원격 URL
        const path = resolve(src);
        if (!path) return;
        try {
          const { width, height } = await sharp(path).metadata();
          if (width && height) {
            props.width = width;
            props.height = height;
            node.properties = props;
          }
        } catch {
          // 읽기 실패 → 치수 없이 통과(PostImage가 native img로 폴백)
        }
      }),
    );
  };
}
```

> TS가 `hast`/`velite` 타입을 못 찾으면: `assets`는 Velite가 export하므로 해결됨. 트리 타입은 위 로컬 `HastNode`로 자족적이라 `@types/hast` 불필요.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run content/lib/rehype-image-dimensions.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: velite.config.ts에 등록**

`velite.config.ts` 상단 import에 추가:

```ts
import rehypeImageDimensions from "./content/lib/rehype-image-dimensions";
```

`mdx.rehypePlugins` 배열에서 `rehypeAutolinkHeadings` 다음에 삽입:

```ts
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      rehypeImageDimensions,
      [
        rehypePrettyCode,
        { theme: { light: codeThemeLight, dark: codeThemeDark }, keepBackground: false, defaultColor: false },
      ],
      rehypeKatex,
    ],
```

- [ ] **Step 6: 빌드 통과 확인(회귀 없음)**

Run: `pnpm build`
Expected: PASS. `.velite` 재생성·기존 글 렌더 정상.

- [ ] **Step 7: 커밋** *(승인 게이트)*

```bash
git add content/lib/rehype-image-dimensions.ts content/lib/rehype-image-dimensions.test.ts velite.config.ts
git commit -m "feat: 본문 이미지 치수 주입 rehype 플러그인"
```

---

## Task 5: PostImage 컴포넌트 + img 매핑

**Files:**
- Create: `shared/mdx/post-image-props.ts`
- Create: `shared/mdx/post-image-props.test.ts`
- Create: `shared/mdx/PostImage.tsx`
- Modify: `views/post-page/lib/mdx-components.tsx`

**Interfaces:**
- Consumes: Task 4가 주입한 `width`/`height`(HAST → props). `next/image`(최적화 활성, Task 1).
- Produces: `resolveImageProps(props)` 순수 함수, `PostImage` 컴포넌트(`img` 매핑용).

- [ ] **Step 0: Next Image 문서 확인**

Read: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` — `width`/`height`/`sizes`/`style` 필수·권장 사용법을 이 repo 버전 기준으로 확인.

- [ ] **Step 1: 순수 함수 실패 테스트 작성**

Create `shared/mdx/post-image-props.test.ts`:

```ts
import { expect, test } from "vitest";
import { resolveImageProps } from "./post-image-props";

test("치수 있는 로컬 → next", () => {
  expect(resolveImageProps({ src: "/static/a.png", alt: "x", width: "640", height: "480" })).toEqual({
    kind: "next", src: "/static/a.png", alt: "x", width: 640, height: 480,
  });
});

test("치수 없음 → img 폴백", () => {
  expect(resolveImageProps({ src: "/static/a.png", alt: "x" })).toEqual({
    kind: "img", src: "/static/a.png", alt: "x",
  });
});

test("원격 URL은 치수 있어도 img 폴백", () => {
  expect(resolveImageProps({ src: "https://x/a.png", width: 640, height: 480 })).toEqual({
    kind: "img", src: "https://x/a.png", alt: "",
  });
});

test("src 없음 → null", () => {
  expect(resolveImageProps({})).toBeNull();
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run shared/mdx/post-image-props.test.ts`
Expected: FAIL — `Failed to resolve import "./post-image-props"`.

- [ ] **Step 3: 순수 함수 구현**

Create `shared/mdx/post-image-props.ts`:

```ts
export type ResolvedImage =
  | { kind: "next"; src: string; alt: string; width: number; height: number }
  | { kind: "img"; src: string; alt: string };

function toPositiveInt(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function resolveImageProps(props: {
  src?: unknown;
  alt?: unknown;
  width?: unknown;
  height?: unknown;
}): ResolvedImage | null {
  const src = typeof props.src === "string" ? props.src : undefined;
  if (!src) return null;
  const alt = typeof props.alt === "string" ? props.alt : "";
  const width = toPositiveInt(props.width);
  const height = toPositiveInt(props.height);
  const remote = /^https?:\/\//.test(src);
  if (!remote && width && height) return { kind: "next", src, alt, width, height };
  return { kind: "img", src, alt };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run shared/mdx/post-image-props.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: PostImage 컴포넌트 구현**

Create `shared/mdx/PostImage.tsx`:

```tsx
import Image from "next/image";
import { resolveImageProps } from "./post-image-props";

const CLASS = "mx-0 my-6 block w-full rounded-pre border border-line";

export function PostImage(props: Record<string, unknown>) {
  const resolved = resolveImageProps(props);
  if (!resolved) return null;
  if (resolved.kind === "next") {
    return (
      <Image
        className={CLASS}
        src={resolved.src}
        alt={resolved.alt}
        width={resolved.width}
        height={resolved.height}
        sizes="(max-width: 768px) 100vw, 700px"
        style={{ width: "100%", height: "auto" }}
      />
    );
  }
  // 원격/치수 미확보 → 네이티브 img 폴백
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={CLASS} src={resolved.src} alt={resolved.alt} />;
}
```

- [ ] **Step 6: mdxComponents에 매핑**

`views/post-page/lib/mdx-components.tsx` 를 아래로 교체:

```tsx
import { lightComponents } from "@/shared/mdx/light-components";
import type { MDXComponentMap } from "@/shared/mdx/MDXContent";
import { PostImage } from "@/shared/mdx/PostImage";

export const mdxComponents: MDXComponentMap = {
  ...lightComponents,
  img: PostImage,
};
```

- [ ] **Step 7: 타입·린트·빌드 검증**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 8: 커밋** *(승인 게이트)*

```bash
git add shared/mdx/post-image-props.ts shared/mdx/post-image-props.test.ts shared/mdx/PostImage.tsx views/post-page/lib/mdx-components.tsx
git commit -m "feat: 본문 이미지를 Next Image로 렌더"
```

---

## Task 6: 수동 E2E 검증 + 문서화

**Files:**
- Modify: `dong-docs/prepare/tech-stack.md` (이미지 정책 1절 추가)
- (임시) 테스트용 대형 이미지 — 검증 후 되돌림

**Interfaces:**
- Consumes: Task 1~5 전체.

- [ ] **Step 1: 대형 샘플 이미지로 게이트 실패 확인**

임의의 큰 이미지(>500KB, >1600px)를 `content/posts/` 아래에 두고 기존 글에서 `![샘플](./big-sample.jpg)` 참조.
Run: `pnpm build`
Expected: 게이트가 `❌ …big-sample.jpg` 출력 후 `exit 1`.

- [ ] **Step 2: 최적화 후 게이트 통과 확인**

Run: `pnpm img:optimize`
Expected: `…→…KB  content/posts/big-sample.jpg` 절감 로그. 파일 width ≤ 1600.
Run: `pnpm build`
Expected: 게이트 통과 + 빌드 성공.

- [ ] **Step 3: dev 렌더 확인**

Run: `pnpm dev` 후 해당 글 페이지 접속.
Expected: 본문 이미지가 `<Image>`로 렌더(요소에 width/height 존재, 로드 시 레이아웃 시프트 없음). 콘솔 경고 없음.

- [ ] **Step 4: 샘플 되돌리기**

임시 이미지와 글의 `![샘플]` 참조 제거. `git status`로 잔여물 0 확인.

- [ ] **Step 5: tech-stack 문서에 이미지 정책 추가**

`dong-docs/prepare/tech-stack.md`에 절 추가:

```markdown
## 이미지 정책

- 배포(Vercel)가 전송 시 Next Image로 리사이즈/webp 변환 (`next.config`에서 `unoptimized` 미사용).
- 본문 이미지는 `![](./x.png)`로 작성 — rehype 플러그인이 치수를 주입해 Next `<Image>`로 렌더.
- 원본은 커밋 전 `pnpm img:optimize`로 최적화(최대 1600px·JPEG q80, 제자리).
- 빌드 게이트: content 이미지가 500KB를 넘으면 빌드 실패 → `pnpm img:optimize` 실행.
```

- [ ] **Step 6: 커밋** *(승인 게이트)*

```bash
git add dong-docs/prepare/tech-stack.md
git commit -m "docs: 이미지 최적화 정책 tech-stack에 명문화"
```

---

## Self-Review

**Spec coverage:**
- ① unoptimized 해제 → Task 1 ✓
- ② optimize-images 스크립트 → Task 3 ✓
- ③ 빌드 게이트 → Task 2 ✓
- ④ rehype 치수 주입 → Task 4 ✓
- ⑤ PostImage 매핑 → Task 5 ✓
- ⑥ package.json(sharp·scripts·build) → Task 1·2·3에 분산 ✓
- 정책 기본값(1600/80/500KB) → Task 2·3 상수 ✓
- 검증(vitest·E2E) → 각 Task 테스트 + Task 6 ✓
- 문서화 → Task 6 ✓

**Placeholder scan:** 모든 코드 스텝에 실제 코드 포함, TODO/TBD 없음. ✓

**Type consistency:** `walkImages`/`collectOversized`/`optimizeBuffer`(Task 2 정의) → Task 3에서 동일 시그니처 사용 ✓. `resolveImageProps` 반환 `ResolvedImage`(Task 5) → `PostImage`에서 `kind` 분기 일치 ✓. `rehypeImageDimensions(options)` 팩토리 시그니처 → 테스트·velite.config 사용 일치 ✓.

## 후속 (범위 밖)
- webp/avif 소스 변환(파일명 변경 → mdx 참조 갱신).
- 본문 blur placeholder.
- 애니메이션 GIF → 비디오.
