# dongCoding — 브랜치 전략

> **2계층 흐름.** `main`(프로덕션) ← **일반 머지** ← `dev`(통합) ← **squash** ← 기능 브랜치.
> Vercel: **`main`만 프로덕션 자동배포.** `dev`·기능 브랜치는 **프리뷰 자동배포 없음**(`vercel.json`으로 차단).
> 커밋 형식은 `commit-convention.md`, 도구·CI 근거는 `tech-stack.md §6`.

---

## 1. 원칙

- **`main`은 항상 배포 가능한 상태만.** `main`에 들어오는 순간 프로덕션으로 나간다. 완성·검증된 `dev`만 `main`으로 올린다.
- **`dev`는 통합 브랜치.** 기능들을 **squash로 깔끔히** 모으는 곳. 기능 1개 = 커밋 1개로 정렬돼 쌓인다.
- **모든 기능 작업은 기능 브랜치에서.** `main`·`dev`에 직접 push하지 않는다(§6 보호).
- **`main`·`dev` 두 장수 브랜치만.** 그 외는 짧게 살고 사라지는 기능 브랜치.
- **프리뷰 자동배포는 끈다**(§7) — 빌드 쿼터 절약. 확인은 로컬(`pnpm dev`/`pnpm build`)에서, 실물은 `main` 프로덕션에서.

---

## 2. 브랜치 종류

| 브랜치 | 역할 | 받는 방식 | 배포 |
|---|---|---|---|
| **`main`** | 프로덕션 (장수) | `dev`에서 **일반 머지**(merge commit) | Vercel 프로덕션 자동배포 |
| **`dev`** | 통합 (장수) | 기능 브랜치에서 **squash** | 배포 없음 |
| **`<type>/<설명>`** | 기능 (단명) | `dev`에서 분기 | 배포 없음 |

> **왜 이 조합?** 기능→`dev`를 squash하면 WIP 커밋 노이즈가 사라지고 **기능당 컨벤션 커밋 1줄**만 `dev`에 남는다. `dev`→`main`을 일반 머지하면 그 기능 커밋들이 **릴리스 묶음(merge commit)** 단위로 `main`에 올라가, "언제 무엇을 배포했는지"가 merge commit으로 구분된다. 기능 단위 정렬(`dev`)과 릴리스 단위 묶음(`main`)을 둘 다 얻는다.

### 2.1 브랜치 이름 — 커밋 type과 통일

`<type>/<간단한-설명>` (kebab-case). `<type>`은 `commit-convention.md`의 7개와 동일 어휘.

```
feat/toc-scrollspy
fix/scrollbar-jank
post/less-is-more
docs/branch-strategy
chore/commitlint-ci
```

> **슬래시 1개 규칙이 중요하다.** 기능 브랜치는 반드시 `type/설명`(슬래시 1개) 형태여야 `vercel.json`의 `*/*` 프리뷰 차단 규칙(§7)에 걸린다. `main`·`dev`는 슬래시가 없어 규칙에서 자연히 제외된다.

---

## 3. 표준 흐름

### 3.1 기능 작업 → `dev` (squash)

```bash
git switch dev && git pull                 # 1) 최신 dev에서 출발
git switch -c feat/toc-scrollspy           # 2) dev에서 기능 브랜치 분기
# … 작업 + 컨벤션대로 커밋 …
git push -u origin feat/toc-scrollspy       # 3) push (프리뷰 배포는 안 생김 — §7)
# 4) GitHub에서 PR 열기 — base: dev
#    PR 제목을 커밋 컨벤션 형식으로! (§5) — squash 시 이게 dev 커밋이 되고, 결국 main까지 간다
# 5) CI 초록불 확인 (프리뷰 없으니 렌더는 로컬 pnpm dev로)
# 6) "Squash and merge"로 dev에 병합 → 기능 브랜치 자동 삭제
```

### 3.2 릴리스 `dev` → `main` (일반 머지)

```bash
# 1) dev가 배포 가능한 상태인지 확인 (CI 초록 + 로컬 검증)
# 2) GitHub에서 PR 열기 — base: main, head: dev
# 3) "Create a merge commit"(일반 머지)로 병합
#    → dev의 기능 커밋들이 merge commit 아래 묶여 main으로 올라간다
# 4) 머지 즉시 main → Vercel 프로덕션 자동 배포
```

> `dev`→`main`은 **일반 머지**라 `dev`의 개별 기능 커밋(각각 컨벤션 형식)이 그대로 `main` 히스토리에 보존된다. merge commit이 릴리스 경계 역할을 한다.

### 3.3 PR 작성 규칙 — 상세 기록 (필수)

기능→`dev` squash는 `dev`에 한 줄만 남긴다. **"무슨 작업을 왜 했는가"의 상세 기록은 PR 본문에 남긴다.** GitHub가 squash 커밋에 `(#번호)`를 자동으로 붙여 언제든 그 PR로 역추적된다.

- **규칙:** 빈 PR·자동 생성 문구 그대로 머지 금지. 최소한 **요약 + 변경 사항**은 채운다.
- **PR 제목**은 커밋 컨벤션 형식으로(→ §5, `commit-convention.md`).
- 템플릿: `.github/pull_request_template.md` (PR 열 때 본문 자동 채움).

```markdown
<!-- .github/pull_request_template.md -->
## 요약
<!-- 무엇을, 왜 했는지 1~3줄 -->

## 변경 사항
<!-- 파일·컴포넌트 단위로 구체적으로 -->
-

## 확인
- [ ] 로컬(`pnpm dev`/`pnpm build`)에서 렌더·동작 확인 (프리뷰 자동배포 없음 — §7)
- [ ] 320px~데스크탑 레이아웃 안 깨짐 (가로 스크롤 0 — design.md §2.7)
- [ ] 라이트/다크 모드 둘 다 확인
- [ ] (post일 때) KaTeX·이미지·목차·OG 정상
- [ ] lint·typecheck 통과 (CI 초록)

## 관련
<!-- 관련 문서/이슈 링크, 있으면 -->
```

> 체크리스트는 **해당되는 항목만** 남기고 나머지는 지운다.

---

## 4. 머지 방식 — 대상별로 다름 (핵심)

**GitHub의 머지 방식 허용은 repo 전역 설정**이라 "대상 브랜치별 자동 강제"는 안 된다. 그래서 **repo는 두 방식을 모두 허용**하되, **각 브랜치의 linear history 규칙(§6)이 방식을 갈라 강제**한다.

| PR 방향 | 방식 | 강제 수단 |
|---|---|---|
| 기능 → **`dev`** | **Squash** | `dev` 보호의 **Require linear history** + rebase 비활성 → merge commit 차단 → **squash로 강제** |
| **`dev` → `main`** | **일반 머지**(merge commit) | `main`은 linear history를 **끔** → merge commit 허용. UI에서 "Create a merge commit" 선택(관례) |

**GitHub → Settings → General → Pull Requests:**
- ✅ **Allow squash merging** — 기능→`dev`용.
- ✅ **Allow merge commits** — `dev`→`main`용.
- ⬜ Allow rebase merging — 해제(안 씀). ← `dev` linear history와 결합해 기능→`dev`를 squash 단일 방식으로 고정.
- ✅ **Default squash commit message = "Pull request title"** — 기능 squash 커밋 = PR 제목.
- ✅ **Automatically delete head branches** — 머지 후 기능 브랜치 자동 청소.

> **왜 강제가 이렇게 갈리나:** `dev`에 linear history를 켜면 merge commit이 막히고, rebase도 꺼놨으니 기능→`dev`는 **squash만** 가능하다(강제됨). 반대로 `main`은 linear history를 꺼서 `dev`→`main` merge commit을 허용한다(방식 선택은 관례).

---

## 5. 커밋 메시지 강제는 **두 겹**

기능→`dev` squash 시 `dev`에 남는 건 **PR 제목**이고, 이 커밋이 그대로 `dev`→`main` 일반 머지로 `main`까지 간다. 그래서 **기능 PR 제목이 곧 durable 커밋**이다.

| 겹 | 검사 대상 | 어디서 | 우회 |
|---|---|---|---|
| 로컬 (조기 피드백) | 개별 커밋 메시지 | husky `commit-msg` + commitlint (`commit-convention.md §4`) | `--no-verify` 금지(규약) |
| **CI (정본·강제)** | **PR 제목** | GitHub Actions PR-title lint (**required check**) | **불가** — 실패 시 머지 잠김 |

→ **기능 PR 제목은 반드시 컨벤션 형식으로.** 예: `post: '덜 만드는 용기' 발행`.
→ `dev`→`main` PR의 제목도 required check(`commit lint`)를 통과해야 하므로 컨벤션 형식으로 쓴다(예: `chore: dev 릴리스`). 단 실제 `main` 커밋은 GitHub가 만드는 **merge commit 마커**(`Merge pull request #N …`)이고, 의미 있는 커밋은 그 아래 묶인 기능 커밋들이다.

PR 제목 lint 워크플로는 `.github/workflows/commitlint.yml`(`amannn/action-semantic-pull-request`) 참고. `pull_request` 트리거라 `dev`·`main` 대상 PR 모두 검사된다.

---

## 6. 브랜치 보호 규칙

### 6.1 `main` (프로덕션 — merge commit 허용)

GitHub → **Settings → Branches → Add rule** (`main`):
- ✅ **Require a pull request before merging** — 직접 push 금지. Require approvals = 0(1인).
- ✅ **Require status checks to pass** — required로 `commit lint`(PR 제목)·`ci`(build·lint·typecheck).
- ⬜ **Require linear history — 끈다.** ← `dev`→`main` merge commit을 허용하려면 반드시 OFF.
- ✅ **Do not allow bypassing (Include administrators)** — 나 자신도 못 우회.

### 6.2 `dev` (통합 — squash 강제)

GitHub → **Settings → Branches → Add rule** (`dev`):
- ✅ **Require a pull request before merging** — 직접 push 금지(기능 PR로만).
- ✅ **Require status checks (`ci`·`commit lint`)** — 통합 전 초록 보장.
- ✅ **Require linear history — 켠다.** ← rebase 비활성과 결합해 기능→`dev`를 **squash로 강제**(§4).
- (선택) Include administrators — 급할 때 직접 밀어넣고 싶으면 끔.

> 강제의 핵심은 **linear history 스위치가 두 브랜치에서 반대**라는 점: `main`은 OFF(merge 허용), `dev`는 ON(squash 강제).

---

## 7. Vercel 연동 — `main`만 배포, 나머지 프리뷰 차단

- **Production Branch = `main`** (Vercel 프로젝트 설정).
- **프리뷰 자동배포는 끈다.** `vercel.json`이 `dev`와 모든 `type/설명` 기능 브랜치를 차단:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "dev": false,
      "*/*": false
    }
  }
}
```

- `dev` → 명시적 `false`. `*/*` → minimatch로 슬래시 1개(모든 `type/설명`) 매칭 → `false`. `main`은 슬래시가 없어 미지정 → 기본 `true` → 프로덕션 배포.
- **트레이드오프:** 머지 전 실물 프리뷰 URL이 없다. 렌더 확인은 **로컬 `pnpm dev`**, 최종은 `main` 배포 후. `post/…`의 KaTeX·이미지·OG는 로컬에서 꼼꼼히 본다.
- **CI(GitHub Actions)는 프리뷰와 무관하게 계속 돈다** — `dev`·`main` 대상 PR 모두에서 build·lint·typecheck·PR제목 검사. 품질 게이트는 그대로 유지.

---

## 8. 셋업 체크리스트 (1회)

- [ ] GitHub: **Squash + Merge commit 둘 다 허용**, Rebase 해제, Default squash 메시지 = PR 제목, 머지 후 브랜치 삭제 (§4)
- [ ] GitHub: `main` 보호 — PR 필수, required checks(`commit lint`·`ci`), **linear history 끔**, Include administrators (§6.1)
- [ ] GitHub: `dev` 보호 — PR 필수, required checks, **linear history 켬** (§6.2)
- [ ] `vercel.json` — `git.deploymentEnabled`로 `dev`·`*/*` 프리뷰 차단 (§7)
- [ ] Vercel: Production Branch = `main` 확인 (§7)
- [ ] `.github/pull_request_template.md` (상세 기록 템플릿) — 확인 항목을 "로컬 확인"으로 (§3.3)
- [ ] `.github/workflows/commitlint.yml` (PR 제목 lint) — `pull_request` 트리거 (§5)
- [ ] 로컬 husky `commit-msg` + commitlint (`commit-convention.md §4`)
