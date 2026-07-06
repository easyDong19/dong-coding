# 이미지 최적화 파이프라인 — 설계

- 날짜: 2026-07-06
- 상태: 승인됨 (구현 전)
- 브랜치: `feat/image-optimization` (base: `dev`)
- 관련 정본: `dong-docs/prepare/tech-stack.md`(Velite/SSG), `dong-docs/design.md` §4.4·§4.9(이미지·코드블록)

## 배경·문제

현재 이미지 처리에 **전송·저장 양쪽으로 최적화가 전혀 걸려있지 않다.** 코드를 확인한 결과:

1. **`next.config.ts`에 `images: { unoptimized: true }`** — Next Image 최적화가 전역으로 꺼져 있다. 그래서 cover(`<Image>`)조차 리사이즈·webp/avif 변환·반응형 srcset이 안 걸리고 원본 바이트가 그대로 전송된다. (cover는 치수·lazy·blur placeholder만 얻음)
2. **본문 이미지는 네이티브 `<img>`** — `views/post-page/lib/mdx-components.tsx`의 컴포넌트 맵에 `img` 오버라이드가 없어(`Counter`만 존재), 마크다운 `![](./x.png)`가 그대로 `<img>`로 렌더된다. Next 최적화 파이프라인을 타지 않는다.
3. **Velite는 이미지를 "최적화"하지 않는다** — `s.image()`(cover)는 sharp로 width/height·8px blur placeholder만 추출하고, 본문 이미지(`remarkCopyLinkedFiles`)는 원본을 content-hash 이름으로 **그대로 복사**할 뿐이다. 리사이즈·재압축·포맷 변환 없음.

결과: 글쓴이가 고해상도 원본(수 MB, 4000px)을 넣으면 **repo(git·`public/static`)에도 그대로 쌓이고, 사용자에게도 원본이 전송**된다. LCP·전송량·저장소 크기 모두 악화된다.

배포는 **Vercel**이다. Vercel은 요청 시점 Next Image 최적화 엔드포인트를 기본 제공하므로, `unoptimized`만 해제하면 전송 최적화가 즉시 돌아온다. 다만 그것은 전송 바이트만 줄일 뿐 **repo에 남는 원본은 여전히 고용량**이다.

## 결정

**전송 바이트(Vercel 위임)와 repo 원본(빌드타임·수동) 양쪽을 모두 경량화한다.** 6개 조각으로 구성한다:

| # | 대상 | 역할 |
|---|---|---|
| 1 | `next.config.ts` | `images: { unoptimized: true }` **제거** → Vercel 전송 최적화 ON |
| 2 | `scripts/optimize-images.mjs` (`pnpm img:optimize`) | content 원본을 sharp로 리사이즈+재압축(제자리 덮어쓰기). repo 경량화 |
| 3 | `scripts/check-image-size.mjs` | 빌드 게이트. 임계치 초과 원본이 있으면 빌드 실패 |
| 4 | `content/lib/rehype-image-dimensions.ts` | 본문 `<img>`에 width/height 주입 (Velite `mdx.rehypePlugins`) |
| 5 | `shared/mdx/PostImage.tsx` | `img` → Next `<Image>` 매핑(client). 주입 치수 사용 |
| 6 | `package.json` | `sharp` 명시 devDependency, `build` 스크립트에 게이트 prepend |

### 본문 이미지 치수 확보 방식 (핵심 갈림길)

Next `<Image>`는 `width`/`height`가 필수인데 Velite는 본문 이미지에 치수를 주지 않는다. 두 후보 중 **자동 rehype 플러그인(A)** 을 채택:

- **A. 자동 주입** ✅ — 글쓴이는 평범하게 `![alt](./x.png)`만 쓴다. 빌드 때 플러그인이 치수를 읽어 주입. 글쓰기 부담 0, 마크다운 문법 유지.
- B. 전용 컴포넌트(`<Img w h>`) — 매번 수치 입력. DX 나쁨. 기각.

## 1. `next.config.ts` — `unoptimized` 해제

```ts
const nextConfig: NextConfig = {
  // images: { unoptimized: true }  ← 제거
};
```

Vercel 배포이므로 별도 로더 설정 불필요. cover는 이 변경만으로 즉시 전송 최적화 수혜. (정적 export(`output: export`)가 아님을 전제 — 현재 config에 export 설정 없음.)

> 참고: Vercel 이미지 최적화는 변환 횟수 기준 과금(Hobby/Pro 무료 할당량 존재). 개인 블로그 트래픽에서는 무시 가능 수준.

## 2. `scripts/optimize-images.mjs` — 원본 경량화 (수동)

- 대상: `content/**/*.{png,jpg,jpeg}` (cover·본문 모두 content/ 하위이므로 함께 처리).
- 처리(sharp):
  - `width > MAX_WIDTH(1600)`이면 `MAX_WIDTH`로 리사이즈(비율 유지, 확대 금지 `withoutEnlargement`).
  - 재인코딩: jpeg → mozjpeg `quality 80`; png → `compressionLevel 9` + palette 양자화.
  - **포맷·파일명 유지** (webp 변환 안 함 — mdx의 `./x.png` 참조가 깨지지 않게). webp/avif 소스 변환은 후속 과제.
- 제자리 덮어쓰기: temp 파일로 쓰고 원자적 replace. **결과가 원본보다 작을 때만** 교체(멱등성 — 이미 최적화된 파일 재실행 시 무한 축소·화질 열화 방지).
- 출력: 파일별 before→after 바이트 + 총 절감량 리포트.
- 범위 밖: `.svg`(벡터), `.gif`(애니메이션), 이미 효율적인 `.webp`/`.avif`는 건드리지 않음.
- 파일 탐색: 신규 의존성 없이 `node:fs/promises` 재귀 walk 사용(또는 Velite가 transitive로 가진 `tinyglobby`). 신규 런타임 dep은 `sharp`만 추가.

## 3. `scripts/check-image-size.mjs` — 빌드 게이트

- 대상: `content/**/*.{png,jpg,jpeg,webp,avif,gif}` stat.
- `SIZE_LIMIT(512 * 1024 = 500KB)` 초과 파일 수집.
- 하나라도 있으면: 파일 목록+크기 출력 후 `"pnpm img:optimize를 실행하세요"` 안내와 함께 `process.exit(1)`.
- 없으면 `exit 0`.
- 임계치 판정 로직(초과 목록 반환)은 순수 함수로 분리해 vitest 단위 테스트 대상으로 삼는다.

## 4. `content/lib/rehype-image-dimensions.ts` — 치수 주입

기존 `content/lib/validate-series.ts` 옆에 배치. Velite의 mdx 컴파일에서 rehype 단계로 동작.

```ts
import { assets } from "velite";          // name(해시파일명) → 원본 절대경로 Map
import sharp from "sharp";
import { visit } from "unist-util-visit";
import { basename } from "node:path";

// 동작 원리:
// - remarkCopyLinkedFiles가 먼저(remark 단계) 실행되어 본문 이미지 src를
//   `/static/<hash>.<ext>`로 재작성하고 assets 맵에 {해시파일명 → 원본경로}를 등록한다.
// - 따라서 rehype 단계에서 img.src의 basename(쿼리/해시 suffix 제거)으로
//   assets.get(name)을 역참조하면 원본 경로를 얻어 sharp로 치수를 읽을 수 있다.
```

- 각 `<img>`(상대경로였던 것 = `/static/`로 시작) 대상: `basename(src)`(? 이후 suffix 제거) → `assets.get(name)` → sharp `.metadata()` → `properties.width`·`properties.height` 주입.
- 비동기 transformer(sharp `.metadata()`가 async): `visit`로 노드 수집 후 `await Promise.all`.
- 원격 URL(`http(s)://`)·`assets` 미등록 노드는 치수 주입 없이 통과(§5 폴백에서 처리).
- 등록: `velite.config.ts`의 `mdx.rehypePlugins`에 `rehypeImageDimensions` 추가(기존 `rehypeSlug`·`rehypeKatex` 등과 나란히).
- 치수의 의미: `optimize-images` 실행 후라면 원본이 이미 ≤1600px이므로 주입 치수는 최적화된 intrinsic 크기 = 레이아웃에 정확.

## 5. `shared/mdx/PostImage.tsx` — `img` → Next Image

`MDXContent`가 이미 `"use client"`이므로 본문은 이미 클라이언트 렌더 경계 안 → Next `<Image>`를 넣어도 **새 client 경계가 생기지 않는다**(오버헤드 없음). `next/image`는 `PostView`가 이미 import 중이라 번들 추가도 없음.

- `mdxComponents`에 `img: PostImage` 매핑(`views/post-page/lib/mdx-components.tsx`).
- props: HAST가 넘기는 `src`·`alt`·`width`·`height`(문자열) → 숫자 파싱.
- **분기**:
  - `width`·`height` 존재 → `<Image src width height style={{width:'100%',height:'auto'}} sizes="(max-width:768px) 100vw, 700px" />`. `sizes`는 reading 컨테이너(`--container-reading`) 기준.
  - 치수 없음(원격·미등록) → 네이티브 `<img>` 폴백(레이아웃 안전).
- 스타일: 기존 `.prose figure img`(라운드·테두리·풀폭)와 시각 일치하도록 className 정렬. `<figure>`+`<figcaption>` 저작 시 캡션 스타일도 그대로 적용.

## 6. `package.json`

- `devDependencies`에 `sharp` 추가 — **Velite가 이미 transitive로 사용하는 버전과 정렬**(중복 설치 방지).
- scripts:
  - `"img:optimize": "node scripts/optimize-images.mjs"`
  - `"build": "node scripts/check-image-size.mjs && velite --clean --strict && next build"` (게이트를 맨 앞에 prepend)

## 데이터 흐름

```
[작성]  ![](./x.png) 원본 추가
   → (선택·수동) pnpm img:optimize  ── 원본 리사이즈·재압축(repo 경량)
   → pnpm build:
        check-image-size (게이트) → velite(치수 주입) → next build
   → 배포: Vercel이 요청 시 리사이즈/webp/avif (전송 경량)
[렌더]  <img> → PostImage → next/image  (치수 O, unoptimized 해제됨)
```

## 정책 기본값 (조정 가능)

| 항목 | 기본값 | 근거 |
|---|---|---|
| `MAX_WIDTH` | 1600px | reading 컨테이너(~700px)의 2배 여유(레티나) |
| JPEG quality | 80 (mozjpeg) | 화질·용량 균형 통상값 |
| 게이트 `SIZE_LIMIT` | 500KB | 본문/커버 실사용 상한. 초과 시 최적화 유도 |
| 본문 blur placeholder | 없음(v1) | width/height만으로 CLS 방지 충분. base64가 본문 HTML을 부풀림. 후속 |

## 엣지 케이스·리스크

- **`assets` 맵 타이밍**: `remarkCopyLinkedFiles`(remark, 먼저) → rehype 순서라 rehype 시점에 맵이 채워져 있음(코드 확인 완료). 순서 의존성 없음.
- **src suffix**: `processAsset`이 `?query`/`#hash` suffix를 붙일 수 있어 basename에서 제거 후 조회.
- **원격 이미지**: `http(s)://`는 치수 주입·최적화 대상 아님 → 네이티브 `<img>` 폴백.
- **SVG/GIF**: optimize 대상 제외. Next Image도 SVG는 기본 미최적화(정상).
- **멱등성**: optimize는 결과가 더 작을 때만 덮어써서 반복 실행 안전.
- **sharp 버전 드리프트**: 명시 dep을 Velite 해석 버전과 맞춰 이중 설치·ABI 충돌 회피.

## 검증·테스트 (test-plan 방침 = vitest)

- 단위:
  - `rehype-image-dimensions`: 고정 fixture 이미지 + mock `assets` 맵으로 HAST `<img>`에 정확한 width/height 주입되는지.
  - `check-image-size` 순수 판정 함수: 임계치 경계에서 초과 목록이 맞는지.
  - `optimize-images` 스모크: fixture 대형 이미지 → 결과 width ≤ MAX_WIDTH & 바이트 감소.
- 수동 E2E:
  1. 큰 샘플 이미지 투입 → `pnpm build` 게이트 **실패** 확인.
  2. `pnpm img:optimize` → 원본 축소 확인 → 게이트 **통과**.
  3. `pnpm dev`에서 본문 이미지가 치수 있는 `<Image>`로 렌더(레이아웃 시프트 없음) 확인.
  4. Vercel 프리뷰에서 `/_next/image` 경유·전송 축소 확인.

## 롤아웃 순서 (구현 계획용)

1. `sharp` devDep 추가.
2. `next.config.ts` `unoptimized` 제거.
3. `rehype-image-dimensions.ts` + `velite.config.ts` 등록.
4. `PostImage.tsx` + `mdxComponents` 매핑.
5. `optimize-images.mjs` + `img:optimize` 스크립트.
6. `check-image-size.mjs` + `build` 게이트 배선.
7. 단위 테스트 작성.
8. 수동 E2E(대형 샘플 이미지).
9. 문서: `tech-stack.md`에 이미지 정책 1절 추가, `plans/00-roadmap.md`에 항목 반영(필요 시).

## 구현 시 주의 (AGENTS.md)

- Next 코드 작성 전 `node_modules/next/dist/docs/`의 Image 관련 가이드를 확인한다(이 저장소의 Next 16은 학습 데이터와 다를 수 있음).
- 커밋·PR·`main`(및 `dev`) 머지는 **승인 게이트** 준수 — 각 시점에 사용자 확인. `--no-verify` 금지.

## 범위 밖 / 후속

- webp/avif **소스 변환**(파일명 변경 동반 → mdx 참조 갱신 필요).
- 본문 이미지 **blur placeholder** 생성.
- 애니메이션 GIF → 비디오 변환.
- pre-commit 자동 압축(lint-staged) — 이번엔 수동 스크립트 + 게이트로 대체.
