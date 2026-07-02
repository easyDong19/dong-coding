# dongCoding — 구현 로드맵 (Implementation Roadmap)

> `prepare/`가 **"왜/무엇"(기획)** 이라면, `plans/`는 **"어떻게"(구현)** 다.
> 이 문서는 페이즈 순서·의존성·전역 제약을 담은 **인덱스**다. 각 페이즈는 `phase-N-*.md`에 bite-sized 태스크로 분해돼 있고, **독립 실행·리뷰가 가능**하다.

---

## 0. 이 플랜의 범위

**포함(이번 플랜):** 셋업 → 콘텐츠 파이프라인 → 엔티티 셀렉터 → 디자인 시스템 → 페이지.
**후속 플랜으로 미룸(YAGNI):** 조회수 시스템(Redis, `pages-plan §5`), RSS 피드(`tech-stack §6.5`), OG 이미지(`tech-stack §6.6`), 검색·댓글.

> 결과물: **글이 즉시 뜨는 정적 블로그** — 목록·상세·시리즈·About이 동작하고, 순수 함수는 전부 테스트로 고정된다. Home의 "가장 많이 본"은 조회수 플랜 전까지 **"최근 글"만** 노출한다(`pages-plan §5.2`의 폴백 = 정상 상태로 취급).

---

## 1. 페이즈 지도

| 페이즈 | 파일 | 산출물 | 테스트 초점 |
|---|---|---|---|
| **0. 셋업** | `phase-0-setup.md` | Next 16 + TS + Tailwind v4 + Velite 스켈레톤, Vitest, **skills 수동 추가(사용자)** | (없음 — 부트스트랩) |
| **1. 콘텐츠 파이프라인** | `phase-1-content-pipeline.md` | Velite 스키마 + prepare 검증 훅 | prepare 검증(빌드 게이트) `test-plan §1.4` |
| **2. 엔티티 셀렉터** | `phase-2-entities-selectors.md` | post/series 순수 셀렉터 + 페이지네이션 | **핵심** — `test-plan §1~3` |
| **3. 디자인 시스템** | `phase-3-design-system.md` | 토큰·레이아웃 프레임·잎 모티프·기본 컴포넌트·테마 | 테마 해석 `test-plan §5.2` |
| **4. 페이지** | `phase-4-pages.md` | Home·Posts·Series·Post상세·About + 빈/에러 상태 | (E2E 없음 — 셀렉터로 검증됨) |

**의존성(엄격 순서):** 0 → 1 → 2 → 3 → 4. 단 **3은 2와 병렬 가능**(디자인 시스템은 데이터에 의존하지 않음). 4는 2·3 모두 필요.

---

## 2. 전역 제약 (모든 태스크에 암묵 적용)

기획 문서에서 확정된 값. **태스크 요구사항은 항상 이 절을 포함한다.** (출처를 괄호로 표기)

- **프레임워크:** Next.js **16** App Router · Turbopack · **SSG**(`generateStaticParams` 전 글 프리렌더). `next lint` 제거됨 → ESLint flat config. (`tech-stack §2.1`)
- **언어·패키지:** **TypeScript** · **pnpm 전용.** `npm`·`yarn` 금지 — 모든 설치·스크립트는 `pnpm`(`pnpm add`/`pnpm dlx`/`pnpm <script>`). `pnpm-lock.yaml`만 커밋(다른 lock 파일 금지), `package.json`에 `"packageManager": "pnpm@<버전>"` 고정. (`§2.2`)
- **빌드 스텝 분리(필수):** `"build": "velite --clean && next build"`. Velite를 `next.config` 안에서 돌리지 않는다(sharp 충돌). (`§3.1`)
- **`.velite` 접근 규칙:** route/view에서 직접 import 금지 → **반드시 `@/entities/post`·`@/entities/series` public API 경유.** `.velite/`는 gitignore. (`§3.1`)
- **아키텍처 — 경량 FSD:** `app/`은 얇게(라우팅+셸), 비즈니스 로직 금지. 계산은 `entities/{post,series}/model/selectors.ts`. MDX 3분할(`shared/mdx/MDXContent.tsx`·`light-components.tsx`·`views/post-page/lib/mdx-components.tsx`). (`§3.2`)
- **셀렉터 테스트 계약:** 모든 셀렉터는 **`posts: Post[]`(또는 `series: Series[]`)를 인자로 받는 순수 함수.** `.velite`는 진입 파일에서만 로드 → 목 없이 픽스처 주입. (`test-plan §0.3`)
- **정렬:** `date desc → slug asc` 복합 정렬(결정적 tie-break). 미래 날짜 글도 노출. (`pages-plan §2`, 확정 2026-07-02)
- **컬러:** **5색(`--paper/--ink/--moss/--stone/--line`)만.** 새 hex 금지, 음영은 투명도 파생. `light-dark()` + `color-scheme`. (`design.md §2.1`)
- **폰트:** **Pretendard 한 종**(`next/font/local` 셀프호스트) + 코드만 JetBrains Mono. serif 금지. (`design.md §2.2`, `tech-stack §6.7`)
- **타입 스케일:** `--text-xs..3xl` **7단계만.** 임의 크기 금지. (`design.md §2.2`)
- **단위·반응형:** font/간격은 `rem`, 1px 헤어라인만 `px`. **320px까지 안 깨짐**, 가로 스크롤 0. (`design.md §2.0, §2.7`)
- **접근성(바닥값):** `:focus-visible` moss 2px, `prefers-reduced-motion` 가드, ARIA·`aria-current`. (`design.md §5`)
- **테스트:** **Vitest.** 순수 함수·검증 훅만 대상. 외부 라이브러리(Velite/rehype/KaTeX)·정적 마크업은 테스트 안 함. (`test-plan §0.2`)
- **커밋:** DRY·YAGNI·TDD·**잦은 커밋**(태스크마다).

---

## 3. `test-plan.md` → 페이즈 매핑

| test-plan 절 | 대상 | 페이즈 | 이번 플랜 |
|---|---|---|---|
| §1.1~1.3 시리즈 셀렉터 | `getSeriesNav`·`getPostsInSeries`·목록 그룹핑 | 2 | ✅ |
| §1.4 prepare 검증 훅 | 참조 무결성·order 중복 | 1 | ✅ |
| §2 페이지네이션 | `paginate`·`getPageItems` | 2 | ✅ |
| §3.1 글 정렬·필터 | `getPublishedPosts` | 2 | ✅ |
| §3.3 관련 포스팅 | `getRelatedPosts` | 2 | ✅ |
| §5.2 테마 해석 | `resolveTheme` | 3 | ✅ |
| §3.2 조회수 랭킹 | `rankToPosts` | — | ⏭ 조회수 플랜 |
| §4 조회수 판정·폴백 | `isBotOrPrefetch` 등 | — | ⏭ 조회수 플랜 |
| §5.1 RSS 필드 매핑 | feed 조립 | — | ⏭ RSS 플랜 |

---

## 4. 실행 방법

이 플랜은 **subagent-driven-development** 또는 **executing-plans**로 태스크 단위 실행한다. 페이즈 파일의 스텝은 체크박스(`- [ ]`)로 진행 추적.

- 페이즈는 **번호 순서대로.** 한 페이즈가 끝나면(모든 테스트 그린 + 커밋) 리뷰 후 다음으로.
- **페이즈 0의 skills 단계는 사용자 수동 작업** → 해당 지점에서 실행을 멈추고 사용자에게 넘긴다(`phase-0-setup.md` Task 0.2 참조).

---

## 5. 열린 항목 (구현 중 확정)

- **페이지 크기 10 / Home N=5** 는 확정값이나 상수로 한 곳에 모은다(`shared/config`). 조정 용이.
- 조회수·RSS·OG 후속 플랜은 이 플랜 완료 후 `phase-5+`로 추가.
