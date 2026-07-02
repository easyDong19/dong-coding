# 리팩터링 백로그 — vercel skills 코드 리뷰 (2026-07-02)

> `vercel-react-best-practices` · `vercel-composition-patterns` 두 스킬을 렌즈로 서브에이전트 병렬 리뷰한 결과 종합.
> 대상: Phase 0~3 산출물 (`app/` · `entities/` · `shared/` · `velite.config.ts`).

**총평:** 구조는 건강하다. 순수 셀렉터·`useSyncExternalStore`·서버 우선 경계·5색 토큰 준수 등 핵심 패턴은 두 리뷰 모두 "잘됨"으로 확인. 심각 이슈는 1건(보일러플레이트 잔재)이고 나머지는 경계·중복 정리.

---

## 🔴 Critical — 1건

### C1. `app/page.tsx` + `app/page.module.css` — create-next-app 템플릿 그대로 *(두 리뷰 공통)*

- [ ] `--font-geist-sans` 참조 → 정의된 건 `--font-pretendard`라 **폰트 설정이 통째로 무효**
- [ ] 자체 hex 팔레트 + `prefers-color-scheme` 미디어쿼리 → **5색 토큰·`data-theme` 테마 시스템 우회** (ThemeToggle이 홈에 안 먹음)
- [ ] `next.svg`/`vercel.svg`에 `priority` preload 낭비

**수정:** views 레이어에 위임하는 얇은 셸로 교체 + `page.module.css`·템플릿 svg 삭제.
**처리 시점:** Phase 4 홈 구현 때 자연 해소 — 그때 처리해도 무방.

---

## 🟡 Warning — 5건

### W1. 의존 방향 역전: `entities` → `shared/test/factories` *(공통)*

- [ ] `entities/post/model/selectors.ts:1` · `entities/series/model/selectors.ts:1`이 `PostLike`/`SeriesLike` 타입을 테스트 픽스처 모듈에서 import. `import type`이라 런타임 비용은 0이지만, 도메인 타입이 테스트 코드에 사는 구조.

**수정:** 타입을 `entities/*/model`로 옮기고 factories가 엔티티 public API에서 import (방향 정상화). Velite 연결 시 `.velite` 파생 타입으로 교체.

### W2. 테마 로직 3중 복제 + `resolveTheme`는 죽은 export *(공통)*

- [ ] `resolve-theme.ts`(테스트만 사용) / `ThemeToggle.getSnapshot` / `theme-init.ts` 문자열이 각자 우선순위 로직을 구현 — 이미 서로 어긋남.
- [ ] `theme-init.ts`는 localStorage 값을 **검증 없이** `data-theme`에 씀 (`"banana"`도 통과).
- [ ] `"dc-theme"` 스토리지 키 리터럴이 `ThemeToggle.tsx`·`theme-init.ts` 2곳에 중복.

**수정:** `resolveTheme` + `STORAGE_KEY`를 단일 소스로 삼아 init 스크립트를 생성하거나, 안 쓸 거면 `resolve-theme.ts` 삭제. init 스크립트에 `t==='light'||t==='dark'` 가드 추가.

### W3. ThemeToggle 하이드레이션 깜빡임

- [ ] `getServerSnapshot()`이 `false` 고정 → 다크 유저는 하이드레이션 직후 라벨이 "다크→라이트"로 뒤집힘. FOUC 방지 스크립트 노력과 모순.

**수정:** `data-theme` 조상 셀렉터로 CSS가 두 라벨을 토글하게 (진실의 원천이 이미 pre-paint로 DOM에 있음).

### W4. `EmptyState` action이 생 `<a>`

- [ ] 내부 링크면 풀 리로드 + prefetch 없음 → `next/link`로 교체.
- [ ] (합성 관점) `{href,label}` 설정 객체 대신 `ReactNode` 슬롯 권장 — 버튼·복수 액션 대응.

### W5. `shared/pagination`에 `index.ts` 없음 *(공통)*

- [ ] 다른 shared 슬라이스는 전부 배럴이 있는데 여기만 deep import 강제. `paginate`·`getPageItems` 재export 배럴 추가.

---

## 🔵 Suggestion — 7건

| # | 위치 | 내용 | 완료 |
|---|---|---|---|
| S1 | `shared/ui/EmptyState.tsx` | `role="alert"` 포커스 effect 때문에 전체가 `"use client"` — status/alert 분리하면 99% 케이스가 서버 컴포넌트 *(공통)* | [ ] |
| S2 | `shared/ui/TagChip.tsx` · `Eyebrow.tsx` | `ComponentPropsWithoutRef` → `ComponentProps`로 바꾸면 React 19 ref-as-prop 통과 (한 단어 수정) | [ ] |
| S3 | `EmptyState` ↔ `LeafSymbols` | `#leaf` 스프라이트 암묵 전역 계약 — `<Leaf/>` 래퍼나 주석으로 명시화 | [ ] |
| S4 | `shared/pagination/paginate.ts:6` | `size=0` → `totalPages=Infinity` 가드 없음 | [ ] |
| S5 | `entities/post/model/selectors.ts:6` | `.filter()` 뒤 `.slice()` 불필요 복사 *(공통)* | [ ] |
| S6 | `velite.config.ts:51` | 루프 변수 `s`가 velite 스키마 빌더 `s` import를 섀도잉 — 미래 footgun | [ ] |
| S7 | `next.config.ts` | `output: 'export'` vs Vercel SSG 결정 미기록 — 배포 단계 전 확정 필요 | [ ] |

---

## ✅ 두 리뷰가 공통으로 확인한 잘된 것 (유지)

- 셀렉터 전부 순수 함수 + 배열 인자 — 테스트 계약(`test-plan §0.3`) 준수
- `app/layout.tsx` 블로킹 테마 스크립트 + `suppressHydrationWarning` 스코프 — 정석 FOUC 패턴
- `next/font/local` Pretendard 셋업, `LeafSymbols` 서버 SVG 스프라이트 (클라 JS 0)
- `"use client"` 최소 표면 (5개 중 2개), 5색 토큰·타입 스케일 위반 없음
- `getRelatedPosts`의 `Set` 태그 조회, 안정 정렬 tie-break

---

## 추천 처리 순서

1. **W1 · W2** — 경계·중복 문제, 지금 싸게 고침
2. **W3 ~ W5** — 소규모 수정
3. **C1** — Phase 4 홈 구현 때 자연 해소
4. **S1 ~ S7** — 관련 파일 만질 때 함께
