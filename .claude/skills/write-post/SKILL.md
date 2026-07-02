---
name: write-post
description: >
  dongCoding 블로그에 새 글(또는 시리즈 글)을 작성·발행할 때 사용. content/posts/*.mdx를
  올바른 frontmatter(slug·date·tags·series·order)로 스캐폴딩하고, 시리즈 연결·빌드 게이트
  검증·post 브랜치/커밋/PR까지 프로젝트 규약대로 진행한다. "글 쓰자", "포스트 추가", "시리즈
  새 회차" 같은 요청에 사용.
---

# write-post — dongCoding 블로그 글 작성

새 글을 프로젝트 규약대로 안전하게 발행하는 절차. 정본은 항상 `dong-docs/`와 `README.md`이며, 이 스킬이 그 규칙을 덮어쓰지 않는다.

## 시작 전 확인

1. **브랜치.** `main`에 직접 작업 금지. 글 작업의 커밋 타입은 **`post`**(글 작성/수정 전용). 새 브랜치 `post/<간단설명>`에서 진행한다 (예: `post/less-is-more`). 이미 작업 브랜치면 그대로 사용.
2. **필요 정보 수집.** 사용자에게 없으면 물어본다:
   - 제목(title)
   - slug (URL이 됨 · 영소문자·하이픈 권장 · 컬렉션 내 유일). 미지정이면 제목에서 제안.
   - 태그(선택), 요약 description(선택)
   - 시리즈 소속 여부 → 소속이면 시리즈 slug + 회차 order
   - 초안 여부(draft)

## 절차

### 1) (시리즈 글이면) 시리즈 정의 확인/생성

- `content/series/<series-slug>.yml`이 있는지 확인.
- 없으면 새로 만든다 (없는 시리즈를 참조하면 **빌드가 실패**한다):
  ```yaml
  slug: <series-slug>
  title: <시리즈 제목>
  description: <한 줄 설명>
  order: 1            # /series 목록 표시 순서 (기본 1)
  complete: false     # 완결이면 true
  ```
- 회차 `order`는 같은 시리즈 내에서 **중복 금지**(중복이면 빌드 실패). 기존 글들의 order를 확인해 다음 번호를 준다.

### 2) 글 파일 생성

`content/posts/<slug>.mdx`:

```mdx
---
title: <제목>
slug: <slug>              # 필수 · URL
date: <오늘 YYYY-MM-DD>   # 필수
description: <요약>        # 선택
tags: [<태그>, ...]        # 선택
series: <series-slug>     # 시리즈 글일 때만
order: <회차>              # series가 있으면 필수(양의 정수)
draft: false              # 초안이면 true
---

## 첫 섹션

여기에 본문. 마크다운(GFM)·코드 펜스·수식(`$..$`, `$$..$$`)을 쓸 수 있다.
```

규칙(어기면 빌드 실패 또는 규약 위반):
- `slug`·`date`·`title` 필수. `date`는 `YYYY-MM-DD`.
- `series`를 쓰면 `order`는 필수(양의 정수).
- 커스텀 JSX 컴포넌트를 본문에 넣으려면 `README.md`의 "MDX에서 JSX 불러오는 법"(3분할·`"use client"`·컴포넌트 맵 등록)을 따른다. 색/간격은 토큰(`var(--moss)` 등)만.
- 본문 작성은 사용자 몫 — 스킬은 뼈대와 배선을 책임진다. 사용자가 원고를 주면 그대로 채운다.

### 3) 빌드 게이트로 검증

```bash
pnpm build
```
- 통과해야 한다. 실패 시 원인:
  - `series`인데 `order` 없음 → frontmatter 보완
  - 없는 시리즈 참조 → 시리즈 yml 생성
  - `order` 중복 → 회차 조정
  - `order` 빈틈(1,2,5)은 **경고만**(빌드는 통과) — 집필 중이면 그대로 둬도 됨
- 필요하면 `pnpm dev`로 `/posts/<slug>`를 눈으로 확인.

### 4) 커밋·PR (프로젝트 규약)

- 커밋: `post: <제목 또는 요약>` (타입 `post` 고정 · 스코프 없음 · 마침표 없음 · 72자 이내 · 한국어 OK).
- `--no-verify` 금지 (husky commit-msg 훅 통과).
- 브랜치당 PR 1개 → **squash merge**. PR 제목도 `post:` 형식. 본문에 무슨 글을 추가/수정했는지 요약.
- CI(`check`)가 green이어야 머지 가능. `check`가 실패하면 로그를 보고 고친다.

## 초안(draft) 운용

- `draft: true` 글은 목록·상세·시리즈·관련글 어디에도 안 뜨고 URL은 404. 커밋해두고 나중에 `draft`를 지워 발행할 수 있다.

## 참고

- frontmatter 스키마·시리즈·빌드 게이트 상세: `README.md`, `dong-docs/prepare/tech-stack.md §3.1`.
- 커밋/브랜치 규약: `dong-docs/prepare/commit-convention.md`, `branch-strategy.md`.
- 화면·정책: `dong-docs/prepare/pages-plan.md`.
