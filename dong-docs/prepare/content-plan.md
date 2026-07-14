# dongCoding — 콘텐츠 기획: 포스트 데이터 계약

> 이 문서는 **"포스트 하나에 무엇이 담기는가"** 를 확정한 기획이다.
> 이 계약이 곧 **Velite frontmatter 스키마**가 되고, 목록·상세·시리즈·OG 화면이 모두 여기서 렌더된다.
> 상위 원칙은 `tech-stack.md §0`("글에 집중"), 스타일 토큰은 `design.md`를 따른다.

---

## 0. 제1원칙 재확인 (이미지 정책의 근거)

이 블로그는 **"글만"이 아니라 "글에 집중"** 이다 (`tech-stack.md §0`).
- 판단 기준: *"이 요소가 읽기를 돕는가, 주의를 훔치는가."*
- 따라서 **커버·그림·도식·수식은 환영** — 콘텐츠에 복무하므로. 배제 대상은 로딩 바처럼 산만·피로를 주는 요소.
- 이 원칙에서 아래 이미지·요약 정책이 파생된다.

---

## 1. 포스트 frontmatter 계약 (확정)

### 1.1 자동 도출 — 작성자가 쓰지 않음, Velite가 계산

| 필드 | 출처 | 쓰임 |
|---|---|---|
| `slug` | `s.slug()` (파일명) | URL `/blog/[slug]` |
| `toc` | `s.toc()` | 따라다니는 목차 (빌드타임, 런타임 파싱 없음) |
| `body` | `s.mdx()` | 본문 렌더 |
| `excerpt` | `s.excerpt()` | `description` 미기재 시 자동 폴백 (§1.4) |

### 1.2 필수 — 작성자가 반드시

| 필드 | 타입 | 검증 | 쓰임 |
|---|---|---|---|
| `title` | string | 비어있으면 빌드 실패 | H1 · 목록 제목 · OG 제목 |
| `date` | isodate | ISO 형식 아니면 빌드 실패 | 발행일 · 메타 time(`tabular-nums`) |

### 1.3 선택 — 있으면 쓰는

| 필드 | 타입 | 기본 동작 | 쓰임 |
|---|---|---|---|
| `description` | string | 없으면 `excerpt` 폴백 | 목록 dek · SEO description · OG description |
| `tags` | string[] | 없으면 메타에 태그 생략 | 메타 칩(`--moss-soft`) · 관련 글 계산 |
| `cover` | `s.image()` | 없으면 이미지 우아하게 생략 | 상세 히어로 · OG · 목록 썸네일 (§1.5) |
| `series` | string(slug 참조) | 없으면 단독 산문 글 | 시리즈 소속 (`tech-stack.md §3.1.1`) |
| `order` | number(양의 정수) | `series` 있으면 **필수** | 시리즈 내 회차 |
| `draft` | boolean | 기본 false | true면 **프로덕션 빌드/목록에서 제외** |
| `updated` | isodate | 없으면 생략 | 수정일 표기(선택) |

> **`series`/`order` 결합 규칙**은 `tech-stack.md §3.1.1`에서 확정(refine: `series` 있으면 `order` 필수, prepare 훅에서 참조 무결성·중복 검증). 여기선 필드 정의만 재기술.

### 1.4 요약(description) 정책 — **수동 선택 + 자동 폴백**

- `description`을 쓰면 → 목록 dek·SEO·OG에 그대로 사용.
- 비우면 → `s.excerpt()`가 본문 앞부분을 자동 추출해 폴백.
- **이유:** 귀찮으면 안 써도 목록·SEO가 비지 않고, 중요한 글은 손으로 다듬을 수 있다. 강제 필수(작성 부담)와 전부 자동(문구 통제 불가)의 절충.

### 1.5 이미지(cover) 정책 — **선택 커버, 3곳 노출**

`cover`는 **선택** 필드(`s.image()` → blur placeholder + 치수 빌드타임 산출). 있을 때만:

| 노출 위치 | 동작 |
|---|---|
| **상세 포스트 상단** | 히어로 이미지 |
| **OG(SNS 공유)** | 커버를 미리보기로. 커버 없으면 **빌드타임 텍스트 OG 폴백** |
| **글 목록(줄기-잎)** | 잎 노드 옆 **작고 차분한 썸네일** — 줄기-잎 텍스트 구조는 유지, 썸네일은 집중을 해치지 않는 선에서 |

> ✅ **design.md 반영 완료:** 잎 옆 썸네일 변형은 `design.md §4.2`(커버 썸네일 변형)에, "글만"이 아닌 "글에 집중" 원칙 정렬은 `design.md §1`(원칙 4)에 반영됨.

---

## 2. Velite 스키마 스케치 (이 계약의 코드 형태)

```ts
// velite.config.ts (발췌)
const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: s
    .object({
      // 필수
      title: s.string(),
      date: s.isodate(),
      // 선택
      description: s.string().optional(),
      tags: s.array(s.string()).optional(),
      cover: s.image().optional(),
      series: s.string().optional(),
      order: s.number().int().positive().optional(),
      draft: s.boolean().default(false),
      updated: s.isodate().optional(),
      // 자동 도출
      slug: s.slug('post'),
      toc: s.toc(),
      excerpt: s.excerpt(),
      body: s.mdx(),
    })
    // 시리즈에 속하면 order 필수 (tech-stack §3.1.1)
    .refine(
      (d) => !d.series || d.order !== undefined,
      '시리즈에 속한 글은 order가 반드시 있어야 합니다',
    ),
})
```

> 교차 참조 검증(존재하지 않는 시리즈·order 중복)은 `prepare` 훅에서. `tech-stack.md §3.1.1` 참조.

---

## 3. 필드 → 화면 매핑 (어느 필드가 어디서 쓰이나)

| 필드 | 목록(index) | 상세(reading) | 시리즈 랜딩 | OG | RSS/SEO |
|---|---|---|---|---|---|
| `title` | ✓ 제목 | ✓ H1 | ✓ 회차 제목 | ✓ | ✓ |
| `date` | ✓ 메타 | ✓ byline | ✓ 정렬 보조 | — | ✓ |
| `description`/`excerpt` | ✓ dek | — | ✓ | ✓ | ✓ |
| `tags` | ✓ 칩 | ✓ post-tag | — | — | — |
| `cover` | ✓ 썸네일 | ✓ 히어로 | (시리즈 cover 우선) | ✓ | — |
| `toc` | — | ✓ 따라다니목차 | — | — | — |
| `series`/`order` | (시리즈 배지) | ✓ series-nav | ✓ 순서 | — | — |
| `draft` | 제외 | 제외 | 제외 | — | 제외 |

---

## 4. 결정 요약 (한 줄)

**포스트 = `title`+`date` 필수, 나머지는 선택. 요약은 수동+자동폴백, 커버는 선택이되 상세 히어로·OG·목록 썸네일 3곳에, 시리즈는 `series`+`order`로 묶고 Velite가 검증한다 — 전부 "글에 집중" 원칙 아래.**

---

## 5. 후속 (완료 현황)

- ✅ **화면별 기획** → `pages-plan.md`로 완료 (목록/상세/시리즈 랜딩/관련 포스팅의 섹션 구성·빈 상태·정렬 규칙).
- ✅ **`design.md` 반영** → §1.5의 두 항목 모두 반영: 잎 옆 썸네일 변형(`design.md §4.2`), "글에 집중" 원칙 정렬(`design.md §1` 원칙 4).
