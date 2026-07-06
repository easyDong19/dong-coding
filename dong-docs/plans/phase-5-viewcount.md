# Phase 5 — 조회수 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **후속 플랜:** 로드맵 §5 "조회수·RSS·OG 후속 플랜은 phase-5+로 추가"의 첫 항목. Phase 0~4 완료가 전제.

**Goal:** Upstash Redis 정렬셋으로 글 조회수를 집계하고, Home의 "가장 많이 본" 섹션을 ISR로 살린다. 모든 Redis 접근은 격리해 **어떤 실패도 렌더를 못 깨뜨리며**(pages-plan §5.2·§5.3), Redis 미설정 로컬 환경에서도 빌드·테스트·개발이 정상 동작한다.

**Architecture:** I/O(Redis)와 순수 로직을 엄격히 분리한다.
- **순수 함수**(목 없이 픽스처 테스트): `isBotOrPrefetch`·`hashIp`·`dedupKey`(`shared/views/lib`), `rankToPosts`(`entities/post` 셀렉터 — Post 메타 병합이라 post 엔티티 소유).
- **I/O 격리 래퍼**(`shared/views`): env 가드 + 타임아웃(`Promise.race`) + try/catch로 감싼 `readTopSlugs`·`readScore`·`recordView`. **절대 throw 안 함** → 실패 시 폴백값(`[]`·`null`·no-op).
- **쓰기**: 글 상세의 클라이언트 비콘 → `POST /api/views` route handler → bot 필터 → dedup `SET NX EX` → `ZINCRBY`.
- **읽기**: Home ISR(`revalidate = 86400`) → `readTopSlugs` → `rankToPosts`로 Velite 현재 글과 교집합.

**Tech Stack:** `@upstash/redis`(REST 클라이언트), Next 16 Route Handler(`app/api/**/route.ts`) + Route Segment Config(`export const revalidate`), Vitest.

## Global Constraints

`00-roadmap.md §2` 적용. 특히 이 플랜 고유:
- **절대 규칙(pages-plan §5.3):** 어떤 Redis 실패(env 미설정·타임아웃·예외)도 `throw`로 전파해 페이지를 깨뜨리지 않는다. ↔ 대조: Velite **빌드 검증**은 일부러 throw(Phase 1). 런타임 비필수 기능이므로 **정책이 정반대**.
- **타임아웃(§5.3):** 읽기 1.5s / 쓰기 2s 상한, 초과 시 폴백.
- **프라이버시(test-plan §4.1):** `hashIp`은 결정적 해시이되 **원문 IP가 출력에 절대 포함되지 않는다.**
- **폴백 = 정상(§5.2):** "가장 많이 본"이 빈 배열이면 **섹션을 통째로 생략**한다(가짜 "최신" 재라벨 금지). 아래 "최근 글"이 화면을 지킴.
- **무료·과금 0(§5):** Upstash Free 플랜 · auto-upgrade OFF. 초과 시 과금 아니라 차단.
- **Next 16 확인 사항:** Route Handler는 `export async function POST(request: Request)`. `POST`는 기본 비캐시(집계에 적합). ISR은 `page.tsx`에 `export const revalidate = 86400`.

---

## ⚠️ 사용자 수동 단계 (인프라 — 코드로 못 함)

아래는 **에이전트가 아니라 사용자**가 하는 계정/인프라 작업이다. **Task 5.1~5.8은 이 단계 없이도 전부 구현·테스트·머지 가능**(env 미설정 시 자동 폴백). 실제 조회수 집계는 배포 + 아래 연결 후 시작된다.

- [ ] **(사용자) Upstash Redis DB 생성** — Vercel 대시보드 → Storage/Marketplace → Upstash Redis, **Free 플랜 · auto-upgrade OFF**.
- [ ] **(사용자) Vercel 프로젝트에 연결** → env 자동 주입: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- [ ] **(사용자) 로컬 개발용** — 위 두 값을 `.env.local`(Task 5.1에서 템플릿 생성됨)에 붙여넣기. 시크릿이라 에이전트가 대신 못 넣음.
- [ ] **(사용자) 플랜 결정** — Hobby(무료)는 **비상업·개인용 전용**. 광고·유료 스폰서 시 Pro 필요(pages-plan §1 각주).

---

### Task 5.1: 의존성·설정·Redis 클라이언트 (env 가드)

**Files:**
- Modify: `package.json`(의존성), `shared/config/index.ts`
- Create: `.env.local.example`, `shared/views/client.ts`

**Interfaces:**
- Produces:
  - `HOME_POPULAR_COUNT: number`(=5) — Home "가장 많이 본" N.
  - `getRedis(): Redis | null` — env 두 개가 모두 있으면 Upstash 클라이언트, 아니면 `null`(즉시 폴백 신호).
- Consumes: `@upstash/redis`.

- [ ] **Step 1: 의존성 설치**

Run: `pnpm add @upstash/redis`
Expected: `package.json` dependencies에 `@upstash/redis` 추가, `pnpm-lock.yaml` 갱신.

- [ ] **Step 2: 설정 상수 추가**

```ts
// shared/config/index.ts (기존 상수 아래에 추가)
export const HOME_POPULAR_COUNT = 5; // pages-plan §1 ("가장 많이 본" N)
```

- [ ] **Step 3: env 템플릿 작성**

```bash
# .env.local.example — 값은 Upstash/Vercel 연결 후 사용자가 채움 (커밋 금지 대상은 .env.local)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**주의:** `.gitignore` 34행 `.env*`가 이 템플릿까지 무시한다. 템플릿은 커밋해야 하므로 `.gitignore`에 예외 추가:
```
!.env.local.example
```
(`.env.local` 실파일은 여전히 무시됨.) 커밋 시 `git add -f .env.local.example` 불필요해짐. 확인: `git check-ignore .env.local.example`가 아무것도 출력 안 하면 OK.

- [ ] **Step 4: env 가드 클라이언트 팩토리**

```ts
// shared/views/client.ts
import { Redis } from "@upstash/redis";

/** env 둘 다 있을 때만 클라이언트 생성. 없으면 null → 호출부는 즉시 폴백. (pages-plan §5.3) */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
```

- [ ] **Step 5: 커밋**

```bash
git add -A && git commit -m "chore: add upstash redis client and viewcount config"
```

---

### Task 5.2: 순수 판정 함수 TDD (test-plan §4.1)

**Files:**
- Create: `shared/views/lib/detect.ts`, `shared/views/lib/detect.test.ts`, `shared/views/lib/keys.ts`, `shared/views/lib/keys.test.ts`

**Interfaces:**
- Produces:
  - `isBotOrPrefetch(headers: Headers): boolean` — 봇 UA·`Sec-Purpose: prefetch` → `true`; 일반/헤더부재 → `false`.
  - `hashIp(ip: string): string` — sha256 hex, 결정적, 원문 IP 미포함.
  - `dedupKey(ipHash: string, slug: string): string` — `dedup:{ipHash}:{slug}` 고정.
- Consumes: Web `Headers`, node `crypto`.

- [ ] **Step 1: 실패 테스트 — 판정 함수**

```ts
// shared/views/lib/detect.test.ts
import { expect, test } from "vitest";
import { isBotOrPrefetch } from "./detect";

const H = (init: Record<string, string>) => new Headers(init);

test("일반 브라우저 UA → false (카운트 허용)", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Mozilla/5.0 (Macintosh) Chrome/120" }))).toBe(false);
});
test("알려진 봇 UA → true", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" }))).toBe(true);
});
test("Sec-Purpose: prefetch → true", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Mozilla/5.0", "sec-purpose": "prefetch;prerender" }))).toBe(true);
});
test("헤더 자체 부재(UA 없음) → false", () => {
  expect(isBotOrPrefetch(H({}))).toBe(false);
});
```

- [ ] **Step 2: 실패 테스트 — 키/해시**

```ts
// shared/views/lib/keys.test.ts
import { expect, test } from "vitest";
import { hashIp, dedupKey } from "./keys";

test("dedupKey 형식 고정 — dedup:{ipHash}:{slug}", () => {
  expect(dedupKey("abc123", "hello")).toBe("dedup:abc123:hello");
});
test("hashIp: 같은 IP → 같은 해시(결정적)", () => {
  expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
});
test("hashIp: 다른 IP → 다른 해시", () => {
  expect(hashIp("1.2.3.4")).not.toBe(hashIp("5.6.7.8"));
});
test("hashIp: 원문 IP가 출력에 포함되지 않음 (프라이버시)", () => {
  expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
});
```

- [ ] **Step 3: 실패 확인** — Run: `pnpm test shared/views/lib` → FAIL(함수 미정의).

- [ ] **Step 4: 구현**

```ts
// shared/views/lib/detect.ts
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|monitor|preview/i;

export function isBotOrPrefetch(headers: Headers): boolean {
  const purpose = (headers.get("sec-purpose") ?? "") + (headers.get("purpose") ?? "");
  if (purpose.toLowerCase().includes("prefetch")) return true;
  const ua = headers.get("user-agent");
  if (!ua) return false; // 헤더 부재 → 카운트 허용 (test-plan §4.1)
  return BOT_UA.test(ua);
}
```

```ts
// shared/views/lib/keys.ts
import { createHash } from "node:crypto";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function dedupKey(ipHash: string, slug: string): string {
  return `dedup:${ipHash}:${slug}`;
}
```

- [ ] **Step 5: 통과 확인** — Run: `pnpm test shared/views/lib` → all passed.

- [ ] **Step 6: 커밋**

```bash
git add -A && git commit -m "feat: add pure bot-detect and dedup-key helpers (test-plan §4.1)"
```

---

### Task 5.3: `rankToPosts` 셀렉터 TDD (test-plan §3.2)

**Files:**
- Modify: `entities/post/model/selectors.ts`, `entities/post/model/selectors.test.ts`

**Interfaces:**
- Produces: `rankToPosts<T extends PostLike>(slugs: string[], posts: T[]): T[]` — Redis 순서 유지 + `posts` 교집합. 없는 slug는 필터(map miss). 다음 순위로 채우지 않음.
- Consumes: `PostLike`(factories), `getPublishedPosts`(같은 파일).

- [ ] **Step 1: 실패 테스트 (§3.2 케이스 1~5)**

```ts
// entities/post/model/selectors.test.ts (기존 import에 rankToPosts 추가, 파일 하단에 append)
import { rankToPosts } from "./selectors";
import { makePost } from "@/shared/test/factories";

const pub = [
  makePost({ slug: "a", date: "2026-01-03" }),
  makePost({ slug: "b", date: "2026-01-02" }),
  makePost({ slug: "c", date: "2026-01-01" }),
];

test("§3.2-1: 정상 top-N → Redis 순서 유지 + 메타 병합", () => {
  const r = rankToPosts(["c", "a", "b"], pub);
  expect(r.map((p) => p.slug)).toEqual(["c", "a", "b"]); // 날짜순 아님 — Redis 순서
});
test("§3.2-2: 삭제된 글 slug 포함 → 필터 후 반환", () => {
  const r = rankToPosts(["a", "ghost", "b"], pub);
  expect(r.map((p) => p.slug)).toEqual(["a", "b"]);
});
test("§3.2-3: 삭제 필터 후 N 미달 → 모자란 대로 반환(채우지 않음)", () => {
  const r = rankToPosts(["a", "x", "y", "z", "b"], pub);
  expect(r.map((p) => p.slug)).toEqual(["a", "b"]);
});
test("§3.2-4: Redis 빈 배열 → [] (섹션 생략 판정)", () => {
  expect(rankToPosts([], pub)).toEqual([]);
});
test("§3.2-5: draft/비공개 slug는 교집합에서 자연 배제", () => {
  const publishedOnly = pub; // 호출부가 getPublishedPosts 결과를 넘김
  const r = rankToPosts(["a", "draftpost", "b"], publishedOnly);
  expect(r.map((p) => p.slug)).toEqual(["a", "b"]);
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test entities/post` → 새 5개 FAIL.

- [ ] **Step 3: 구현 (같은 파일에 추가)**

```ts
// entities/post/model/selectors.ts (파일 하단에 추가)
export function rankToPosts<T extends PostLike>(slugs: string[], posts: T[]): T[] {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  return slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is T => p !== undefined); // map miss 필터 (pages-plan §5.2)
}
```

- [ ] **Step 4: 통과 + public API + 커밋**

```ts
// entities/post/index.ts 는 이미 `export * from "./model/selectors";` 로 rankToPosts 재노출됨 — 확인만.
```

Run: `pnpm test entities/post` → all passed.

```bash
git add -A && git commit -m "feat: add rankToPosts selector for view ranking (test-plan §3.2)"
```

---

### Task 5.4: 읽기 I/O 래퍼 — 격리·폴백 (test-plan §4.2 읽기)

**Files:**
- Create: `shared/views/read.ts`, `shared/views/read.test.ts`, `shared/views/index.ts`

**Interfaces:**
- Produces:
  - `readTopSlugs(n: number): Promise<string[]>` — `ZRANGE views 0 n-1 REV`. 실패/미설정 → `[]`.
  - `readScore(slug: string): Promise<number | null>` — `ZSCORE views {slug}`. 실패 → `null`.
  - `withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T>` — 내부 유틸.
- Consumes: `getRedis`(Task 5.1).

- [ ] **Step 1: 실패 테스트 (§4.2 읽기 경로 — 클라이언트 목)**

```ts
// shared/views/read.test.ts
import { expect, test, vi, beforeEach } from "vitest";

const getRedis = vi.fn();
vi.mock("./client", () => ({ getRedis: () => getRedis() }));

beforeEach(() => getRedis.mockReset());

test("§4.2-1: env 미설정(getRedis=null) → 즉시 [] (Redis 호출 안 함)", async () => {
  getRedis.mockReturnValue(null);
  const { readTopSlugs } = await import("./read");
  expect(await readTopSlugs(5)).toEqual([]);
});
test("§4.2-3: Redis 예외 → [] (throw 전파 없음)", async () => {
  getRedis.mockReturnValue({ zrange: () => { throw new Error("boom"); } });
  const { readTopSlugs } = await import("./read");
  await expect(readTopSlugs(5)).resolves.toEqual([]);
});
test("정상: zrange 결과 그대로 반환", async () => {
  getRedis.mockReturnValue({ zrange: async () => ["a", "b"] });
  const { readTopSlugs } = await import("./read");
  expect(await readTopSlugs(5)).toEqual(["a", "b"]);
});
test("§4.2-5: ZSCORE 실패 → null (뷰에서 숫자 숨김)", async () => {
  getRedis.mockReturnValue({ zscore: () => { throw new Error("x"); } });
  const { readScore } = await import("./read");
  expect(await readScore("a")).toBeNull();
});
```

> `vi.resetModules()`가 필요하면 각 테스트 상단에 추가. `await import`로 목 적용 후 로드.

- [ ] **Step 2: 실패 확인** — Run: `pnpm test shared/views/read` → FAIL.

- [ ] **Step 3: 구현**

```ts
// shared/views/read.ts
import { getRedis } from "./client";

const VIEWS_KEY = "views";

/** ms 초과 시 fallback으로 resolve (읽기 1.5s / pages-plan §5.3). */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function readTopSlugs(n: number): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return []; // env 미설정 → 호출 안 함
  try {
    const op = redis.zrange<string[]>(VIEWS_KEY, 0, n - 1, { rev: true });
    return await withTimeout(Promise.resolve(op), 1500, []);
  } catch {
    return []; // 절대 규칙: 렌더를 못 깨뜨림
  }
}

export async function readScore(slug: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const op = redis.zscore(VIEWS_KEY, slug) as Promise<number | null>;
    return await withTimeout(op, 1500, null);
  } catch {
    return null;
  }
}
```

```ts
// shared/views/index.ts (public API)
export { readTopSlugs, readScore } from "./read";
export { recordView } from "./write"; // Task 5.5에서 생성
```

> Step 3 시점엔 `write.ts`가 없으므로 `index.ts`의 recordView export는 Task 5.5 완료 후 추가하거나, 지금 `write.ts` 스텁을 먼저 만든다. 순서상 index.ts의 write 재노출은 Task 5.5 Step에서 추가.

- [ ] **Step 4: 통과 + 커밋**

Run: `pnpm test shared/views/read` → all passed.

```bash
git add -A && git commit -m "feat: add isolated redis read helpers with timeout fallback (test-plan §4.2)"
```

---

### Task 5.5: 쓰기 I/O + route handler (test-plan §4.2 쓰기)

**Files:**
- Create: `shared/views/write.ts`, `shared/views/write.test.ts`, `app/api/views/route.ts`
- Modify: `shared/views/index.ts`(recordView 재노출)

**Interfaces:**
- Produces:
  - `recordView(input: { slug: string; ipHash: string }): Promise<void>` — dedup `SET NX EX 86400` 성공 시에만 `ZINCRBY`. 모든 실패 조용히 무시.
  - `POST /api/views` — body `{ slug: string }`. bot/prefetch·미설정 시 no-op. 항상 204 반환(집계 성공/실패 무관).
- Consumes: `getRedis`, `isBotOrPrefetch`, `hashIp`, `dedupKey`.

- [ ] **Step 1: 실패 테스트 — 쓰기 격리 (§4.2-4)**

```ts
// shared/views/write.test.ts
import { expect, test, vi, beforeEach } from "vitest";

const getRedis = vi.fn();
vi.mock("./client", () => ({ getRedis: () => getRedis() }));
beforeEach(() => getRedis.mockReset());

test("env 미설정 → no-op (throw 없음)", async () => {
  getRedis.mockReturnValue(null);
  const { recordView } = await import("./write");
  await expect(recordView({ slug: "a", ipHash: "h" })).resolves.toBeUndefined();
});
test("§4.2-4: 쓰기 실패 → 조용히 무시(swallow)", async () => {
  getRedis.mockReturnValue({ set: () => { throw new Error("boom"); } });
  const { recordView } = await import("./write");
  await expect(recordView({ slug: "a", ipHash: "h" })).resolves.toBeUndefined();
});
test("dedup 미존재 시(SET 성공) ZINCRBY 호출", async () => {
  const zincrby = vi.fn(async () => 1);
  getRedis.mockReturnValue({ set: async () => "OK", zincrby });
  const { recordView } = await import("./write");
  await recordView({ slug: "a", ipHash: "h" });
  expect(zincrby).toHaveBeenCalledWith("views", 1, "a");
});
test("dedup 존재 시(SET null) ZINCRBY 호출 안 함", async () => {
  const zincrby = vi.fn(async () => 1);
  getRedis.mockReturnValue({ set: async () => null, zincrby });
  const { recordView } = await import("./write");
  await recordView({ slug: "a", ipHash: "h" });
  expect(zincrby).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test shared/views/write` → FAIL.

- [ ] **Step 3: 구현 — recordView**

```ts
// shared/views/write.ts
import { getRedis } from "./client";
import { dedupKey } from "./lib/keys";
import { withTimeout } from "./read";

const VIEWS_KEY = "views";

export async function recordView(input: { slug: string; ipHash: string }): Promise<void> {
  const redis = getRedis();
  if (!redis) return; // env 미설정 → no-op
  try {
    // 24h 중복방지: 키가 없을 때만 SET, 성공("OK")이면 최초 조회
    const set = redis.set(dedupKey(input.ipHash, input.slug), 1, { nx: true, ex: 86400 });
    const first = await withTimeout(Promise.resolve(set), 2000, null);
    if (first === "OK") {
      await withTimeout(Promise.resolve(redis.zincrby(VIEWS_KEY, 1, input.slug)), 2000, 0);
    }
  } catch {
    // swallow — 카운트만 안 오름, UI 영향 0 (pages-plan §5.2)
  }
}
```

- [ ] **Step 4: index.ts에 recordView 재노출**

```ts
// shared/views/index.ts — recordView 라인이 이미 있으면 확인만
export { readTopSlugs, readScore } from "./read";
export { recordView } from "./write";
```

- [ ] **Step 5: 통과 확인** — Run: `pnpm test shared/views/write` → all passed.

- [ ] **Step 6: route handler**

```ts
// app/api/views/route.ts
import { recordView } from "@/shared/views";
import { isBotOrPrefetch } from "@/shared/views/lib/detect";
import { hashIp } from "@/shared/views/lib/keys";

// POST는 기본 비캐시 (Next 16 route handler). 집계 전용.
export async function POST(request: Request): Promise<Response> {
  try {
    if (isBotOrPrefetch(request.headers)) return new Response(null, { status: 204 });
    const { slug } = (await request.json()) as { slug?: string };
    if (typeof slug === "string" && slug.length > 0) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
      await recordView({ slug, ipHash: hashIp(ip) });
    }
  } catch {
    // 어떤 실패도 삼킴 — 집계는 fire-and-forget
  }
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 7: 커밋**

```bash
git add -A && git commit -m "feat: add view aggregation endpoint with dedup and bot filter (test-plan §4.2)"
```

---

### Task 5.6: 글 상세 조회수 비콘 (클라이언트 fire-and-forget)

**Files:**
- Create: `views/post-page/ViewBeacon.tsx`
- Modify: `views/post-page/PostView.tsx`

**Interfaces:**
- Produces: `<ViewBeacon slug={string} />` — 마운트 시 1회 `POST /api/views`. StrictMode 이중 실행 가드.
- Consumes: `POST /api/views`(Task 5.5).

- [ ] **Step 1: 비콘 컴포넌트**

```tsx
// views/post-page/ViewBeacon.tsx
"use client";
import { useEffect, useRef } from "react";

export function ViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return; // StrictMode 이중 마운트 가드
    sent.current = true;
    fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {}); // 실패 삼킴 (UI 영향 0)
  }, [slug]);
  return null;
}
```

- [ ] **Step 2: PostView에 주입**

`views/post-page/PostView.tsx`의 최상위 반환 JSX 안에 `<ViewBeacon slug={post.slug} />`를 추가하고 상단에 `import { ViewBeacon } from "./ViewBeacon";`.

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm build`
Expected: 타입/빌드 통과. (로컬 env 없으면 POST는 204·no-op — 정상.)

```bash
git add -A && git commit -m "feat: fire view beacon from post page on read"
```

---

### Task 5.7: Home "가장 많이 본" 섹션 + ISR

**Files:**
- Modify: `app/page.tsx`, `views/home/HomeView.tsx`, `entities/post/index.ts`

**Interfaces:**
- Produces: `listPopularPosts(n: number): Promise<Post[]>`(entities/post) — `readTopSlugs` → `rankToPosts(published)`.
- Consumes: `readTopSlugs`(Task 5.4), `rankToPosts`(Task 5.3), `getPublishedPosts`.

- [ ] **Step 1: entities/post에 인기글 조립 함수**

```ts
// entities/post/index.ts 에 추가
import { readTopSlugs } from "@/shared/views";
import { rankToPosts } from "./model/selectors";

export async function listPopularPosts(n: number) {
  const slugs = await readTopSlugs(n);
  return rankToPosts(slugs, getPublishedPosts(raw)); // 교집합 = draft/삭제 자연 배제
}
```

- [ ] **Step 2: Home 라우트 — ISR + 두 섹션 데이터**

```tsx
// app/page.tsx
import { listPublishedPosts, listPopularPosts } from "@/entities/post";
import { HOME_RECENT_COUNT, HOME_POPULAR_COUNT } from "@/shared/config";
import { HomeView } from "@/views/home/HomeView";

export const revalidate = 86400; // 하루 1회 재검증 — 조회수 랭킹 신선도 (pages-plan §1)

export default async function HomePage() {
  const recent = listPublishedPosts().slice(0, HOME_RECENT_COUNT);
  const popular = await listPopularPosts(HOME_POPULAR_COUNT);
  return <HomeView recent={recent} popular={popular} />;
}
```

- [ ] **Step 3: HomeView — "가장 많이 본" 섹션(조건부)**

```tsx
// views/home/HomeView.tsx — 시그니처와 본문 수정
export function HomeView({ recent, popular }: { recent: Post[]; popular: Post[] }) {
  if (recent.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          eyebrow="dongCoding"
          message="아직 심어둔 글이 없습니다. 곧 첫 잎이 돋아납니다."
          action={{ href: "/about", label: "소개 보기 →" }}
        />
      </div>
    );
  }
  return (
    <div className="wrap">
      {popular.length > 0 && (
        <section className="mb-[2.4rem]">
          <div className="mb-[1.2rem] flex items-baseline gap-[0.7rem]">
            <Eyebrow>가장 많이 본</Eyebrow>
          </div>
          <PostList posts={popular} />
        </section>
      )}
      <section>
        <div className="mb-[1.2rem] flex items-baseline gap-[0.7rem]">
          <Eyebrow>최근 글</Eyebrow>
        </div>
        <PostList posts={recent} />
        <Link className="mx-0 mt-[1.4rem] mb-[0.5rem] inline-block text-sm" href="/posts">
          전체 글 보기 →
        </Link>
      </section>
    </div>
  );
}
```

> 두 섹션 **독립·중복 허용**(확정 2026-07-01) — 인기글을 최근 글에서 제외하지 않는다. `popular.length === 0`(로컬·미설정·조회 0)이면 섹션 통째 생략 → 화면은 "최근 글"로 멀쩡(§5.2 폴백).

- [ ] **Step 4: 검증 + 커밋**

Run: `pnpm test && pnpm build`
Expected: 테스트 그린 + 빌드 통과. 로컬(env 없음)에선 "가장 많이 본" 미노출 = 정상.

```bash
git add -A && git commit -m "feat: restore Home '가장 많이 본' section with ISR revalidate"
```

---

### Task 5.8: 개별 글 조회수 표시 (메타: 날짜 · 읽기 시간 · 조회수)

> **확정(사용자, 2026-07-04):** 개별 조회수는 **표기한다.** 글 상세 메타 순서 = **날짜 · 읽기 시간 · 조회수**. 현재 메타는 이미 `날짜 · 읽기시간(N분)`을 점 구분자로 렌더(`PostView.tsx`) → 뒤에 조회수만 같은 패턴으로 추가.
> **렌더 위치·신선도:** 조회수는 메타 라인(서버 렌더)에 있어야 하므로 상세 페이지도 `export const revalidate = 86400`으로 ISR화 → `ZSCORE`를 빌드/재검증 시 읽음. Home과 동일 패턴(≤1일 지연 허용). 읽는 사람 본인의 방금 조회는 다음 재검증에 반영. `views === null`(미설정·실패)이면 **조회수 span 자체를 숨김**(0·에러 표기 금지, §5.2).

**Files:**
- Modify: `app/posts/[slug]/page.tsx`, `views/post-page/PostView.tsx`

**Interfaces:**
- Consumes: `readScore(slug)`(Task 5.4).
- Produces: `PostView` prop `views: number | null` 추가.

- [ ] **Step 1: 상세 라우트 — ISR + score 조회 → 뷰 전달**

```tsx
// app/posts/[slug]/page.tsx
import { readScore } from "@/shared/views";
// ... 기존 import 유지

export const revalidate = 86400; // ZSCORE 신선도 — Home과 동일 (pages-plan §5)

// generateStaticParams / generateMetadata 는 그대로.

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const nav = getSeriesNavForPost(slug);
  const seriesTitle = nav ? (getSeriesDetail(nav.series)?.meta.title ?? nav.series) : null;
  const related = getRelated(slug);
  const views = await readScore(slug); // 실패/미설정 → null

  return <PostView post={post} nav={nav} seriesTitle={seriesTitle} related={related} views={views} />;
}
```

- [ ] **Step 2: PostView 메타에 조회수 추가 (날짜 · 읽기 시간 · 조회수)**

`views/post-page/PostView.tsx` — prop 타입에 `views: number | null` 추가하고, 메타 `<div>`의 읽기 시간 span **뒤에** 조회수를 조건부로 추가:

```tsx
export function PostView({
  post,
  nav,
  seriesTitle,
  related,
  views,
}: {
  post: Post;
  nav: SeriesNavData<Post> | null;
  seriesTitle: string | null;
  related: Post[];
  views: number | null;
}) {
```

```tsx
        {/* 메타 라인: 날짜 · 읽기 시간 · 조회수 */}
        <div className="mb-[1.6rem] flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.4rem] text-sm text-stone">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="h-[2px] w-[2px] rounded-full bg-stone" aria-hidden="true" />
          <span>{post.metadata.readingTime}분</span>
          {views !== null ? (
            <>
              <span className="h-[2px] w-[2px] rounded-full bg-stone" aria-hidden="true" />
              <span>조회 {views.toLocaleString()}</span>
            </>
          ) : null}
        </div>
```

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm test && pnpm build`
Expected: 통과. 로컬(env 없음)에선 `views === null` → 조회수 미표기, 메타는 `날짜 · 읽기 시간`만 = 정상.

```bash
git add -A && git commit -m "feat: show per-post view count in meta (date · read time · views)"
```

---

## Self-Review (Phase 5)

- **스펙 커버리지:**
  - pages-plan §5.1 플로우(집계 SET NX+ZINCRBY / 랭킹 ZRANGE REV / ZSCORE) → Task 5.4·5.5. ✅
  - §5.2 폴백(빈 배열 섹션 생략·재라벨 금지·최근 글 안전판) → Task 5.7 Step 3. ✅
  - §5.3 안전장치(env 가드·타임아웃·봇/prefetch·절대 규칙) → Task 5.1·5.2·5.4·5.5. ✅
  - test-plan §3.2 케이스 1~5 → Task 5.3. §4.1 판정 3함수 → Task 5.2. §4.2 폴백 1·3·4·5 → Task 5.4·5.5. ✅
  - test-plan §3.2 케이스 3(N 미달 채우지 않음) 명시 커버. ✅
- **플레이스홀더:** 없음 — 모든 테스트/구현 코드 전문 제공. `index.ts`의 write 재노출 순서 의존성만 주석으로 명시. ✅
- **타입 일관성:** `rankToPosts(slugs, posts)` 시그니처 = Task 5.3 정의 = 5.7 사용. `recordView({slug, ipHash})` = Task 5.5 정의 = route handler 호출. `readTopSlugs`/`readScore` 반환(`string[]`/`number|null`) = 폴백값과 일치. `isBotOrPrefetch(headers: Headers)` = route handler `request.headers` 전달과 일치. ✅
- **§4.2-2(타임아웃):** `withTimeout` 유틸로 구현되나 타이머 기반 유닛 테스트는 생략(구조로 보장). 필요 시 `vi.useFakeTimers`로 추가 가능 — 명시. ⚠️(의도적)

## 완료 기준

- `pnpm test` 그린(신규 detect·keys·rank·read·write 케이스 포함), `pnpm build` 통과.
- 로컬(env 미설정)에서 Home은 "최근 글"만, 상세 페이지 정상 — **폴백이 정상 상태**로 동작.
- (배포 후·사용자 인프라 연결 시) 실제 조회 → `ZINCRBY` 집계 → 다음 ISR 재검증에서 "가장 많이 본" 노출.
- 후속: 로드맵 §1 지도에 Phase 5 행 추가 + `test-plan §3.2/§4` ⏭ → ✅ 갱신(문서 위생, 별도 커밋).
