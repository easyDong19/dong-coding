# OG 이미지 생성 — 설계 스펙

- **날짜**: 2026-07-07
- **브랜치**: `feat/og-image`
- **정본 근거**: `prepare/tech-stack.md §6.6`(OG 이미지), `design.md §2.1`(5색 토큰)·`§3`(줄기-잎 모티프), `plans/00-roadmap.md §2`(경량 FSD — `app/` 얇게)
- **상태**: 설계 확정, 구현 대기

---

## 1. 목표

글을 SNS(카카오톡·트위터·슬랙 등)에 공유할 때 뜨는 대표 미리보기 이미지(Open Graph)를 제공한다. 원칙(`tech-stack §0`)과 정합: **런타임 생성 0** — 모든 OG 이미지는 빌드타임에 정적 PNG로 고정한다.

## 2. 범위

| 대상 | OG 이미지 | 방식 |
|---|---|---|
| **글 상세** (`/posts/[slug]`) | 글별 동적 | cover 있으면 커버, 없으면 텍스트 폴백 카드 |
| **사이트 기본** (홈·시리즈·About 등 나머지 전부) | 공용 1장 | 브랜드 카드(제목 없이 워드마크+태그라인) |

- 전 페이지 개별 동적 생성은 **범위 밖**(YAGNI). 시리즈/About 전용 OG는 후속 필요 시.

## 3. 원리 (배경)

`next/og`의 `ImageResponse`는 브라우저 없이 **JSX/CSS → (Satori) SVG → (Resvg) PNG** 로 이미지를 굽는다. Satori는 **flexbox와 CSS 일부만** 지원(`display:grid` 불가)하고, 폰트는 파일 데이터를 직접 주입해야 한다. SSG(`generateStaticParams`)와 결합하면 글마다 빌드타임에 PNG로 고정된다.

## 4. 카드 디자인 (텍스트 폴백)

- **규격**: 1200×630 (OG 표준 1.91:1), flexbox 레이아웃.
- **팔레트**: 라이트 고정(정적 PNG라 다크 대응 불가, SNS 피드에서 밝은 배경이 가독성 안전).
  - 배경 `--paper` `#F4F5EE` / 제목 `--ink` `#232A22` / 브랜드·잎 `--moss` `#4F6442` / 태그라인 `--stone` `#6B7163`.
  - **새 hex 금지**(`design.md §2.1`) — 위 5색 토큰의 라이트값만 사용.
- **구성**:
  - 상단 moss 액센트 바(줄기 모티프 연장).
  - 좌상단 브랜드 행: 잎 심볼(`shared/ui/LeafSymbols`의 `#leaf` path 재사용) + `dongCoding`(moss).
  - 중앙 제목: 글 `title`, Pretendard 700, ~64px, 2~3줄 자동 줄바꿈, `word-break: keep-all`(한글 조판, `design.md §3`), 초과 시 말줄임.
  - 우하단 큰 잎 워터마크: moss 저투명도.
  - 좌하단 태그라인: `SITE_DESCRIPTION`, stone, ~28px.
- **사이트 기본 카드**: 같은 렌더러에서 제목 슬롯을 `dongCoding` 워드마크로 대체한 변형(코드 재사용).

## 5. 태그라인 교체 (사이트 전역)

`SITE_DESCRIPTION` 상수를 교체한다: `"코드와 식물 사이, 천천히 자라는 기록"` → **`"코드는 쉽지, 말을 보여줘"`**.

- 전파 지점: OG 카드 태그라인 · `<meta name="description">`(SEO) · RSS 피드 사이트 설명.
- **부수 정리**: 현재 `app/layout.tsx`가 title·description을 문자열 하드코딩 중 → `SITE_NAME`·`SITE_DESCRIPTION` 상수 참조로 전환(DRY, 이번에 손대는 파일이므로 포함).

## 6. 파일 구조 (Next 16 파일 컨벤션 + 경량 FSD)

Next의 `opengraph-image` 파일 컨벤션은 **폴더 계층 상속**을 따른다 — 루트의 이미지는 더 구체적인 하위 이미지가 없는 모든 라우트에 적용된다.

```
app/
├── opengraph-image.tsx           # 사이트 기본 카드. 홈·시리즈·About 등이 자동 상속
├── posts/[slug]/
│   ├── opengraph-image.tsx        # 글별 동적. 더 구체적 → 글 상세만 덮어씀
│   └── page.tsx                   # (수정 없음 — metadataBase가 og:image 절대경로화)
└── layout.tsx                     # metadataBase 추가 + twitter.card + SITE_* 상수화
shared/
├── og/
│   ├── card.tsx                   # 카드 렌더러 (두 opengraph-image가 공유 → app/ 얇게)
│   └── font.ts                    # satori용 폰트 버퍼 로더
└── config/site.ts                # SITE_DESCRIPTION 교체
```

## 7. 동작 흐름

- **글 상세** `app/posts/[slug]/opengraph-image.tsx`
  - `generateStaticParams`: 전 발행 글(`listPublishedPosts()`, page.tsx와 동일) → 빌드타임 PNG 고정.
  - `export const size = { width: 1200, height: 630 }`, `contentType = 'image/png'`.
  - `Image({ params })`: `getPostBySlug(slug)`.
    - `post.cover` 있으면 → 커버를 `<img>`로 1200×630 `objectFit: cover` 정규화(임의 비율 흡수).
    - 없으면 → `shared/og/card`의 폴백 카드(제목 = `post.title`).
- **사이트 기본** `app/opengraph-image.tsx`
  - 같은 `card`를 제목 없이(브랜드+태그라인) 렌더. 단일 정적 PNG.
- **metadataBase** `app/layout.tsx`
  - `metadataBase: new URL(getSiteUrl())`. → 모든 og/twitter 이미지가 절대 URL로 자동 해결.
  - dev: `.env.local`의 `http://localhost:3000`. prod: env 필수 → 누락 시 빌드 실패(RSS `getSiteUrl` fail-fast와 동일 정책).
- **twitter** `app/layout.tsx`
  - `openGraph` 기본값 + `twitter: { card: 'summary_large_image' }`. 트위터가 `og:image`를 큰 카드로 사용 → 이미지 중복 생성 없음(DRY).

## 8. 폰트 처리 (핵심 기술 리스크)

- Satori는 **woff2를 파싱하지 못한다**(ttf/otf/woff만 지원). 현재 셀프호스트 폰트는 `shared/fonts/PretendardVariable.woff2`라 **그대로 재사용 불가**.
- 대응: 한글 제목 렌더용 **Pretendard OTF/TTF 파일을 추가**(`shared/og/`에 배치, `font.ts`가 `fs.readFile`로 버퍼 로드 → `ImageResponse`의 `fonts`에 전달).
- **subset 여부는 구현 플랜에서 확정**: 한글 제목은 임의 글자라 정적 subset이 어렵다 → 우선 전체 한글 커버 OTF(용량 큼)로 동작 확보 후, 필요 시 자주 쓰는 음절 subset으로 경량화(YAGNI — 1차는 전체). 이 폰트는 페이지 JS 번들이 아니라 빌드타임에만 읽으므로 클라이언트 전송 바이트에는 영향 없음.

## 9. 테스트 방침

- `test-plan §0.2`: 외부 라이브러리(satori/next/og)·정적 마크업은 테스트하지 않는다. OG 렌더 자체는 테스트 대상이 아니다.
- 순수 함수가 생기면(예: 제목 말줄임/줄바꿈 계산, 카드용 데이터 pick) 그 함수만 Vitest 대상. 카드/폰트 로더는 I/O·마크업이므로 제외.
- 검증은 **빌드 산출물 확인**: `pnpm build` 후 각 라우트의 `og:image` 절대 URL과 생성된 PNG 존재를 확인.

## 10. 비목표 (YAGNI)

- 페이지별(시리즈·About) 전용 동적 OG.
- OG 이미지의 다크 모드 변형.
- 커버 이미지 위 텍스트 오버레이(커버는 그대로 정규화만).
- 런타임(요청 시) OG 생성 — SSG 고정만.

## 11. 완료 기준

- [x] `SITE_DESCRIPTION` 교체(→ "코드는 쉽지, 말을 보여줘") + `layout.tsx` 상수화.
- [x] `layout.tsx`에 `metadataBase`·`openGraph`·`twitter.card` 반영. 글 상세 `generateMetadata`도 명시적 세팅(얕은 병합 대응).
- [x] `shared/og/card.tsx`·`font.ts` 작성. 폰트는 woff2→static ttf(400·700, 라틴+한글 음절 subset) 변환 — `scripts/build-og-fonts.py`.
- [x] `app/opengraph-image.tsx`(사이트 기본) 생성.
- [x] `app/posts/[slug]/opengraph-image.tsx`(cover/폴백 분기) 생성.
- [x] `pnpm build` 성공 + 홈·글·시리즈·About `og:image` 절대 URL·PNG 생성 확인(카드 시각 검증 완료).
- [x] `pnpm typecheck`·`pnpm lint`·`pnpm test`(111) 그린.

> **폰트 구현 메모(§8 확정):** satori는 woff2 미지원 → 순수 ttf 필요. `font.flavor = None`으로 저장해야 함(woff2에서 로드 시 flavor가 woff2로 남아 "Unsupported OpenType signature wOF2" 발생). 한자·희귀 심볼 제외 subset으로 각 ~2.5MB(빌드타임 전용, 클라이언트 번들 무관).
