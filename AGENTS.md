<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:dongcoding-conventions -->
# 작업 규약 (dongCoding) — 반드시 준수

커밋·브랜치·PR·디자인·기술 결정의 정본(SSOT)은 `dong-docs/`다. 작업 전 관련 문서를 따른다.

## 승인 게이트 — 최우선 (반드시 준수)
- **`git commit`, PR 생성, 머지(`dev`·`main`)는 사용자가 명시적으로 지시할 때만 수행한다.** 알아서(자동으로) 하지 않는다.
- 파일 수정·빌드·테스트 등 작업은 진행하되, **커밋/PR/머지 직전에는 반드시 사용자에게 물어보고 승인을 받는다.** "커밋할까요? / PR 올릴까요? / 머지할까요?"
- 한 번의 승인은 그 1회에만 적용된다. 다음 커밋·PR·머지는 다시 물어본다.
- `--no-verify`, admin 강제 머지 등 우회 금지.

## 커밋 — 정본: `dong-docs/prepare/commit-convention.md`
- 형식 `<type>: <제목>`. type 7개만: `feat fix post docs style refactor chore`. 제목은 한국어 OK·**끝에 마침표 없음**·72자 이내. **스코프 안 씀.**
- `post` = 글 작성/수정(블로그 전용), 나머지는 표준 의미.
- husky `commit-msg` 훅이 형식을 강제한다. **`--no-verify` 사용 금지.**

## 브랜치·PR — 정본: `dong-docs/prepare/branch-strategy.md`
- **2계층 흐름:** `main`(프로덕션) ← **일반 머지** ← `dev`(통합) ← **squash** ← 기능 브랜치. **`main`·`dev`에 직접 커밋 금지.**
- 기능 작업은 **`dev`에서 분기**한 `<type>/<간단설명>` 브랜치에서 (예: `feat/toc-scrollspy`, `post/less-is-more`). 브랜치 이름의 type은 커밋 type과 같은 어휘.
- **머지 방식이 대상별로 다름:** 기능→`dev`는 **squash merge**, `dev`→`main`은 **일반 머지**(merge commit). 기능 PR 제목은 커밋 컨벤션 형식으로(squash 시 `dev` 커밋이 되어 `main`까지 간다).
- PR 본문에 **요약·변경 사항을 상세히** 기록한다(빈 PR/자동생성 그대로 머지 금지). 템플릿: `.github/pull_request_template.md`.
- **프리뷰 자동배포 없음:** `main`만 Vercel 프로덕션 배포. `dev`·기능 브랜치는 `vercel.json`으로 차단 → 확인은 로컬(`pnpm dev`/`pnpm build`).

## 디자인·기술 — 정본
- 디자인: `dong-docs/design.md` — **5색 토큰만·Pretendard 한 종·줄기-잎 모티프.** 새 색/폰트/임의 크기 금지.
- 기술: `dong-docs/prepare/tech-stack.md` — Next 16 SSG · Velite · 경량 FSD · **pnpm 전용**(npm/yarn 금지). 테스트 방침은 `test-plan.md`.

## Skills — 작업별 사용 규약
스킬은 보조 도구다. **정본은 항상 `dong-docs/`이며, 스킬이 정본 규칙을 덮어쓰지 않는다.**
- **브레인스토밍·설계 스펙 문서** → `superpowers:brainstorming` 등이 만드는 설계 스펙은 **`dong-docs/specs/YYYY-MM-DD-<주제>-design.md`에 작성한다** (스킬 기본 경로 `docs/superpowers/specs/`를 이 규약으로 덮어쓴다). dong-docs가 정본이므로 설계 산출물도 여기 모은다.
- **Velite/스키마·검증** → `zod` (Zod refine 규칙, `tech-stack §3.1.1`).
- **UI 프리미티브** → `shadcn` (v4 기준 설치, `tech-stack §2.4`). CLI는 프로젝트 `packageManager`대로 `pnpm dlx shadcn@latest`.
- **컴포넌트·시각 작업** → `frontend-design` (단 색·타입스케일·모티프 정본은 `design.md`).
- **폴더 구조·경계·public API** → `feature-sliced-design` (단 폴더 규약 정본은 `tech-stack`·`plans/00-roadmap §2`).
- **Next/React 성능·합성 패턴(참고)** → `vercel-react-best-practices`, `vercel-composition-patterns`.
- **배포·최적화** → `deploy-to-vercel`, `vercel-optimize` — **이번 플랜(Phase 0~4) 범위 밖**, 후속 배포 단계에서 사용.
<!-- END:dongcoding-conventions -->
