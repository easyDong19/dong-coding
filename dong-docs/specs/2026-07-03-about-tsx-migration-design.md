# About 페이지 MDX → TSX + 타입 데이터 전환 — 설계

- 날짜: 2026-07-03
- 상태: 승인됨 (구현 전)
- 관련 정본: `dong-docs/prepare/pages-plan.md` §4·§6·§7, `dong-docs/design.md` §4.10

## 배경·결정

현재 `content/about.mdx`는 진짜 마크다운이 `## 이력`·`## 프로젝트` 두 줄뿐이고, 나머지는 전부 JSX 컴포넌트에 배열/객체 props를 넘기는 **MDX 옷을 입은 구조화 데이터**다. pages-plan §4가 MDX를 추천한 근거("글처럼 편집 가능")가 실현되지 않으며, 대신 다음 비용을 치른다:

- props 무검증 — `as unknown as MDXComponentMap` 캐스팅, `items` 오타/필드 누락을 빌드가 못 잡음
- About 하나를 위한 Velite 컬렉션 + MDX 번들 + `MDXContent`(client) 레이어
- 컴포넌트 4종이 MDX 주입 때문에 전부 `"use client"`

**결정: About은 TSX + 타입 데이터로 렌더한다. 콘텐츠 관리 원칙을 "MDX는 글(posts·series 본문) 전용, 구조화 페이지 데이터는 TS"로 명문화한다.**

재빌드 관점 참고: About은 SSG이므로 MDX든 TSX든 콘텐츠 수정 시 재빌드+재배포가 필요한 것은 동일하다. 이 축은 선택 근거가 아니다.

## 1. 데이터 모델 — `entities/about/data.ts` (신규)

```ts
export interface AboutData {
  profile: { role: string; src: string; alt: string };
  intro: string[];
  timeline: { when: string; what: string }[];
  projects: { title: string; description: string; href: string }[];
}

export const aboutData: AboutData = {
  profile: {
    role: "코드는 쉽지, 말을 보여줘",
    src: "/profile.jpg",
    alt: "유동연 프로필 사진",
  },
  intro: [
    "안녕하세요 개발자 유동연입니다.",
    "저는 논리, 철학, 금융, 비즈니스, 야구 등 여러 분야에 관심이 많습니다.",
    "일할 때 제약조건을 정하는 것을 가장 중요하게 생각합니다.",
  ],
  timeline: [{ when: "2026", what: "dongCoding 블로그를 심었습니다." }],
  projects: [
    {
      title: "dongCoding",
      description: "천천히 자라는 기록. 이 블로그.",
      href: "https://github.com/easyDong19/dong-coding",
    },
  ],
};
```

- 콘텐츠는 **워킹트리의 미커밋 about.mdx 최신 수정분**(새 role 문구·인사말 추가)을 정본으로 이관한다. 위 값이 그 최신본이다.
- `entities/about/index.ts`는 유지하되 `.velite` import를 제거하고 `getAbout()`이 `aboutData`를 반환, `AboutData` 타입을 export한다. **`app/about/page.tsx`는 수정 불필요.**
- 위치 근거(경량 FSD): 콘텐츠 접근은 entities 경유라는 기존 규약 유지. content/는 Velite가 읽는 MDX 전용으로 정리.

## 2. 렌더링 — `views/about/AboutView.tsx` 재작성

- `MDXContent` 의존 제거. `AboutView({ about }: { about: AboutData })`가 직접 렌더:
  `ProfileHeader → Intro → <h2>이력</h2> → Timeline → <h2>프로젝트</h2> → Projects`
  (현재 화면과 동일한 구성·순서)
- 섹션 헤딩은 뷰에서 `<h2>`로 직접 렌더 — 기존 `AboutView.module.css`의 `.body h2` 스타일(¶ 모티프 포함)이 그대로 적용되어 **시각 결과물 변화 없음**. rehype-slug의 heading 앵커는 About에서 실용 가치가 없어 보존하지 않는다.
- `ProfileHeader`·`Intro`·`Timeline`·`ProjectCard` 4종의 `"use client"` 제거 → 서버 컴포넌트화. 4종 모두 훅/이벤트 핸들러 미사용 확인 완료.
- **프로필 헤더 — 이름 없이 role을 h1으로**(2026-07-03 결정). 기존 MDX는 `ProfileHeader`에 필수 prop `name`을 넘기지 않아 빈 `<h1>`이 렌더되고 있었다(MDX라 타입체크가 못 잡음). TSX 전환 시 타입 안전성으로 드러난 문제. 이름 h1을 없애고 role(tagline)을 `<h1 className={styles.role}>`로 승격 — 시각적 모습은 현재(아바타 + stone tagline)와 동일하되 빈 h1 문제를 해소. `.name`·`.eyebrow` CSS는 미사용이 되어 제거, `.role`에 `font-size: var(--text-base)` 추가.

## 3. 삭제 대상

| 대상 | 조치 |
|---|---|
| `content/about.mdx` | 삭제 |
| `velite.config.ts` `about` 컬렉션 정의 + `collections: { …, about }` | 제거 |
| `views/about/lib/mdx-components.tsx` | 삭제 (`as unknown as` 캐스팅 소멸) |
| `entities/about/index.ts`의 `.velite` import·`About` 타입 re-export | `data.ts` 기반으로 교체 |

## 4. 문서 갱신 — 코드보다 먼저 수행

| 문서 | 변경 |
|---|---|
| `pages-plan.md` §4 (L94 부근) | "MDX 단일 페이지 추천" → "TSX + 타입 데이터(`entities/about/data.ts`)"로 결정 변경 + 사유(구조화 데이터라 MDX 이점 부재·타입 안전성). "MDX는 글 전용, 구조화 페이지 데이터는 TS" 원칙 명문화 |
| `pages-plan.md` §6 (L143) | `About 소스 = content/about.mdx` → `entities/about/data.ts` |
| `pages-plan.md` §7 (L168) | "(about.mdx는 커밋 콘텐츠)" → 데이터 파일 기준 문구로 갱신 |
| `design.md` (L277) | "소스는 `content/about.mdx`에서 MDX 컴포넌트로 주입" 각주 갱신 |
| `plans/phase-4-pages.md` | 수정하지 않음 — 완료된 페이즈의 역사 기록 |

## 5. 검증·브랜치·범위 밖

- 브랜치 `refactor/about-tsx`, 커밋 type `refactor` (기능 동일·구조 변경). 커밋·PR·머지는 승인 게이트 준수 — 각 시점에 사용자 확인.
- 검증:
  1. `pnpm build` 통과 (Velite 컬렉션 제거 후 `.velite` 타입 재생성 포함)
  2. `/about` 렌더가 전환 전과 시각적으로 동일한지 확인
  3. `grep`으로 `about.mdx`·`aboutComponents`·velite `About` 잔여 참조 0건 확인
- 범위 밖: `public/static/profile.jpg`(untracked 잔여물)의 정리 여부는 별도 확인. `public/profile.jpg` 수정분은 이번 작업과 독립적으로 이미 워킹트리에 존재.
