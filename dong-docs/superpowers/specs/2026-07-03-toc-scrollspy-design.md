# 따라다니는 목차 (TOC scrollspy) — 설계

- **날짜:** 2026-07-03
- **브랜치:** `feat/toc-scrollspy`
- **정본 근거:** `dong-docs/design.md §4.5` · `dong-docs/prepare/tech-stack.md §5.1` · `§2.7`(반응형)
- **범위:** 읽기 화면(포스트 상세)에 데스크톱 전용 sticky 목차 + 스크롤스파이 추가. Phase 4.7의 유일한 미구현 항목.

## 1. 목표 & 비목표

**목표:** 긴 글에서 현재 읽는 위치를 은은하게 안내하는 따라다니는 목차. 데이터 파이프라인(`s.toc()`)은 이미 완비돼 있고 **UI만 구현**한다.

**비목표(이번 범위 밖):** About 페이지 목차(`about` 스키마에 `toc` 필드 없음), 모바일 목차, 조회수/RSS/OG 등 후속 플랜 항목.

## 2. 확정된 결정

정본(`design.md §4.5`)이 시각·동작을 고정한 위에, 열려 있던 3개를 다음으로 확정한다.

| 항목 | 결정 |
|---|---|
| 헤딩 깊이 | **H2 + H3** (2단 중첩) |
| 위치 | 본문 **오른쪽 여백**에 `position:sticky` |
| 노출 기준 | **헤딩 ≥1개면 항상 노출**, 0개면 컴포넌트 자체를 렌더하지 않음(빈 박스 금지) |

정본에서 이미 확정되어 재론하지 않는 것:

- 구성: eyebrow "목차"(moss·weight 500·자간 `.02em`) + 무불릿 `ol`, 좌측 `1px var(--line)` 기준선.
- 배치: 데스크톱 `--reading` 바깥 여백. **`≤1100px` 숨김**(모바일 본문 폭 불침범, `design.md §2.7`).
- 상태: 링크 기본 `--stone`(저대비) → hover `--ink` → active `--moss` + 좌측 라인 moss.
- active 판정: **IntersectionObserver**(스크롤 이벤트 폴링 없음). 애니메이션 없음("은은한 보조").
- 데이터: Velite `s.toc()` 빌드타임(런타임 파싱 0).
- 접근성: `<nav aria-label="목차">`, 키보드 포커스 링 유지.
- 새 색·폰트·임의 크기 도입 0 (5색 토큰만).

## 3. 아키텍처 — FSD `widgets/toc/`

기존 `widgets/series-nav`·`widgets/related`와 동일한 위젯 패턴. `PostView`(서버 컴포넌트)가 직렬화 가능한 `post.toc`를 클라이언트 위젯에 전달.

```
widgets/toc/
  lib/flatten-toc.ts          # 순수: 중첩 toc 트리 → 평탄 [{ id, text, depth }]
  lib/flatten-toc.test.ts
  lib/pick-active.ts          # 순수: 헤딩 위치 목록 + 트리거선 → active id
  lib/pick-active.test.ts
  model/use-active-heading.ts # 클라 훅: IntersectionObserver → rect → pick-active
  Toc.tsx                     # 'use client', 중첩 <ol> 렌더 + active 스타일
  Toc.module.css              # §4.5 시각 스펙
  index.ts                    # export { Toc } from "./Toc"
```

**격리 원칙:** DOM/IO에 의존하지 않는 두 순수 함수(`flatten-toc`, `pick-active`)를 분리해 단위 테스트로 커버하고, 훅은 브라우저 rect를 순수 함수에 먹이는 얇은 어댑터로 둔다. 기존 테스트가 전부 순수 셀렉터인 프로젝트 방침(`test-plan.md`)과 일치.

### 3.1 데이터 계약

`s.toc()` 출력 원소는 `{ title: string; url: string; items: TocEntry[] }` 형태(`url`은 `#slug`).

- `flattenToc(entries): FlatHeading[]` — `FlatHeading = { id: string; text: string; depth: 2 | 3 }`. `url`에서 `#` 제거 → `id`. 문서 순서 보존, H3는 부모 H2 뒤에 이어붙임. 빈 `items` 정상 처리.
- `pickActive(positions, triggerLine): string | null` — `positions = { id: string; top: number }[]`(문서 순서). **트리거선 위로 지나간 마지막 헤딩의 id**를 반환. 전부 트리거선 아래면 첫 헤딩 id(최상단), 목록이 비면 `null`.

## 4. 스크롤스파이 알고리즘

`design.md §4.5`가 "IntersectionObserver, 스크롤 폴링 없음"만 정하고 *어느 헤딩을 active로 볼지*는 미정 → 아래로 확정.

1. 마운트 시 `flattenToc` 결과의 `id`로 실제 `<h2>/<h3>` 요소를 수집.
2. IntersectionObserver를 상단 트리거 밴드로 설정: `rootMargin: "-{마스트헤드높이}px 0px -65% 0px"`, `threshold: 0`. 헤딩이 밴드를 **가로지를 때만** 콜백 발화(스크롤 이벤트 리스너 없음).
3. 콜백 안에서 각 헤딩의 `getBoundingClientRect().top`을 읽어 `pickActive(positions, triggerLine)` 호출 → active id 갱신. (이벤트 구동이며 rAF/스크롤 폴링 아님.)
4. 두 헤딩 사이 먼 구간에선 "트리거선 위로 지나간 마지막 헤딩" 규칙이 직전 active를 유지. 최상단에선 첫 헤딩.

**대안(기각):** ① topmost intersecting 헤딩만 active → 섹션 길이 편차에서 깜빡임. ② scroll 이벤트 + rect 폴링 → `design.md`가 명시 금지.

**offset 처리:** 마스트헤드가 sticky이므로 트리거선 = 마스트헤드 높이(+여유). 구현 시 마스트헤드 높이 값(토큰 또는 실측)을 확인해 `rootMargin` 상단과 sticky `top`에 반영. 본문 `h2`에는 이미 `scroll-margin-top`이 있어 앵커 점프 시 마스트헤드에 안 가림.

## 5. 레이아웃 배선 & 반응형

- `views/post-page/PostView.tsx`: `post.toc`를 `<Toc toc={post.toc} />`로 전달. 서버 컴포넌트가 클라이언트 위젯을 자식으로 렌더(직렬화 가능 데이터만 전달).
- `PostView.module.css`: 그리드 `1fr [article: col 2] 1fr`에서 **오른쪽 여백(col 3)** 에 `<aside>` 배치, 내부 요소 `position:sticky; top: <offset>`.
- **`≤1100px`: `aside { display:none }`.** 숨겨도 그리드 1fr 여백은 현행과 동일하게 비어 본문 폭 불변.
- 목차가 뷰포트보다 길 경우 `max-height` + `overflow-y:auto`로 자체 스크롤(가로 오버플로 금지 원칙, `§2.7`).

## 6. 스타일 (§4.5, 새 토큰 0)

- 컨테이너: `<nav aria-label="목차">` → eyebrow "목차"(`--moss`·500·`.02em`) + 무불릿 `ol`, 좌측 `1px var(--line)`.
- 링크: 기본 `--stone`(저대비), hover `--ink`, active `--moss` + 좌측 라인 `--moss`.
- H3: H2 대비 들여쓰기(좌측 라인 기준선 유지).
- 폰트 `--text-sm`, 애니메이션 없음, `:focus-visible` 포커스 링 유지.

## 7. 테스트

- `flatten-toc.test.ts` — 평탄화(깊이/문서 순서/빈 items/`#` 제거).
- `pick-active.test.ts` — 경계(첫 헤딩 위 = 최상단, 두 헤딩 사이, 마지막 헤딩, 빈 목록 → null).
- IntersectionObserver·DOM 통합은 jsdom 한계로 단위테스트 제외 — 로직을 순수 함수로 이미 분리했으므로 훅은 얇은 어댑터.
- 게이트: `pnpm test`(vitest) 통과 + `pnpm build`(`velite --strict && next build`) 통과. `--no-verify` 금지.

## 8. 위험 & 완화

- **마스트헤드 offset 부정확 → active가 이르거나 늦게 바뀜:** 트리거선을 마스트헤드 실제 높이에 맞추고 값 하드코딩 대신 토큰/변수로.
- **오른쪽 1fr 여백이 좁아 목차가 답답:** `≥1100px`에서만 노출 + `≥1280px` 프레임에서 여유. 목차 폭에 `min-width` 하한.
- **헤딩 id 불일치(중복 슬러그):** `rehype-slug`가 유니크 id를 보장. `flattenToc`는 `url` 그대로 사용.
