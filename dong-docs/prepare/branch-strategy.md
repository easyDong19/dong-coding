# dongCoding — 브랜치 전략

> **GitHub Flow(경량).** `main` 하나 + 짧게 살고 사라지는 기능 브랜치 + PR.
> Vercel: **`main` = 프로덕션 자동배포**, 그 외 모든 브랜치 = **프리뷰 배포**.
> 커밋 형식은 `commit-convention.md`, 도구·CI 근거는 `tech-stack.md §6`.

---

## 1. 원칙

- **`main`은 항상 배포 가능한 상태만.** push되는 순간 프로덕션으로 나가므로, 미완성은 절대 올리지 않는다.
- **모든 작업은 브랜치에서.** `main`에 직접 push하지 않는다(보호 규칙으로 강제 — §4).
- **브랜치 1개 = 논리적 작업 1개 = PR 1개 = (스쿼시 후) `main` 커밋 1개.**
- `develop`·`release`·`hotfix` 브랜치는 **두지 않는다** — 1인 + 프리뷰 배포가 있으니 불필요한 무게.

---

## 2. 브랜치 이름 — 커밋 type과 통일

`<type>/<간단한-설명>` (kebab-case). `<type>`은 `commit-convention.md`의 7개와 동일 어휘.

```
feat/toc-scrollspy
fix/scrollbar-jank
post/less-is-more
docs/branch-strategy
chore/commitlint-ci
```

> 브랜치 이름과 커밋 type이 같은 어휘를 쓰므로 머릿속 모델이 하나로 유지된다. 장수 브랜치는 `main` 뿐.

---

## 3. 표준 흐름

```bash
git switch -c feat/toc-scrollspy         # 1) main에서 브랜치 분기
# … 작업 + 컨벤션대로 커밋 …
git push -u origin feat/toc-scrollspy    # 2) push → Vercel 프리뷰 자동 생성
# 3) GitHub에서 PR 열기 (base: main). PR 제목을 컨벤션 형식으로! (§6)
# 4) 프리뷰 URL에서 실제 렌더 확인 + CI 초록불 확인
# 5) Squash merge  (PR 제목이 곧 main 커밋 메시지가 된다)
# 6) 머지 즉시 main → 프로덕션 자동 배포. head 브랜치는 자동 삭제
```

### 3.1 PR 작성 규칙 — 상세 기록 (필수)

스쿼시하면 `main`엔 한 줄만 남으므로, **"무슨 작업을 왜 했는가"의 상세 기록은 PR 본문에 남긴다.** PR 본문·대화·프리뷰·diff는 GitHub에 영구 보존되고, `main`의 각 커밋엔 `(#번호)`가 자동으로 붙어 언제든 그 PR로 역추적된다.

- **규칙:** 빈 PR이나 자동 생성 문구 그대로 머지 금지. 최소한 **요약 + 변경 사항**은 채운다.
- **PR 제목**은 커밋 컨벤션 형식으로(→ §6, `commit-convention.md`). 이 제목이 곧 `main` 커밋이 된다.
- 아래 템플릿을 `.github/pull_request_template.md`로 두면 PR 열 때 본문이 자동으로 채워진다.

```markdown
<!-- .github/pull_request_template.md -->
## 요약
<!-- 무엇을, 왜 했는지 1~3줄 -->

## 변경 사항
<!-- 파일·컴포넌트 단위로 구체적으로 -->
-

## 확인
- [ ] 프리뷰에서 렌더 확인 (URL: )
- [ ] 320px~데스크탑 레이아웃 안 깨짐 (가로 스크롤 0 — design.md §2.7)
- [ ] 라이트/다크 모드 둘 다 확인
- [ ] (post일 때) KaTeX·이미지·목차·OG 정상
- [ ] lint·typecheck 통과

## 관련
<!-- 관련 문서/이슈 링크, 있으면 -->
```

> 체크리스트는 **해당되는 항목만** 남기고 나머지는 지워도 된다 — 형식보다 "다음에 이 PR을 다시 봤을 때 무슨 작업이었는지 이해되는가"가 기준.

---

## 4. `main` 보호 규칙 (확정)

GitHub → **Settings → Branches → Add rule** (`main`):

- ✅ **Require a pull request before merging** — 직접 push 금지.
  - 1인이므로 **Require approvals = 0** (셀프 리뷰 강제하고 싶으면 1 + self-approve).
- ✅ **Require status checks to pass before merging** — 다음을 **required**로:
  - `commit lint` — PR 제목 검사 (§6)
  - `ci` — build·lint·typecheck (`tech-stack.md §6.4`)
- ✅ **Require linear history** — 스쿼시/리베이스만 남아 그래프가 깔끔.
- ✅ **Do not allow bypassing the above settings (Include administrators)** — **이걸 켜야 나 자신도 못 우회한다.** "실전" 강제의 핵심.
- ⬜ Require branches to be up to date — 선택(1인이면 충돌이 드묾).

---

## 5. 머지 방식 = **Squash only**

GitHub → **Settings → General → Pull Requests**:

- ✅ **Allow squash merging만** 체크 (Merge commit·Rebase는 **해제**) → 실수로 다른 방식 못 고르게.
- ✅ **Default commit message = "Pull request title"** ← 중요. 스쿼시 커밋 제목이 PR 제목으로 채워진다.
- ✅ **Automatically delete head branches** → 머지 후 브랜치 자동 청소.

**결과:** 기능 브랜치의 지저분한 WIP 커밋은 스쿼시로 사라지고, `main`에는 **PR당 컨벤션 커밋 1줄**만 정렬돼 쌓인다. **세부 작업 기록은 PR 본문(§3.1)에 남긴다** — GitHub가 스쿼시 커밋에 `(#번호)`를 자동으로 붙이므로, `main`의 한 줄에서 언제든 상세 기록으로 되짚어갈 수 있다. 히스토리 가독성과 상세 기록을 둘 다 얻는 구조.

> **대안:** 상세 기록을 git 히스토리 자체에 박고 싶다면 Default 커밋 메시지를 "Pull request title **and description**"으로 바꾼다 — 단 `main` 로그가 길어진다. 이 프로젝트는 **한 줄 유지 + 상세는 PR**을 택한다(스캔성 우선, 기록은 §3.1이 보장).

---

## 6. 커밋 메시지 강제는 **두 겹** (스쿼시라서 중요)

스쿼시하면 **로컬 커밋 메시지는 `main`에 남지 않는다** — `main`에 남는 건 **PR 제목**이다. 그래서 강제 지점이 둘로 나뉜다:

| 겹 | 검사 대상 | 어디서 | 우회 |
|---|---|---|---|
| 로컬 (조기 피드백) | 개별 커밋 메시지 | husky `commit-msg` + commitlint (`commit-convention.md §4`) | `--no-verify`로 가능 — 하지만 어차피 스쿼시로 사라짐 |
| **CI (정본·강제)** | **PR 제목** = 스쿼시 커밋 메시지 | GitHub Actions PR-title lint (**required check**) | **불가** — 실패 시 머지 버튼이 잠김 |

→ **PR 제목을 반드시 컨벤션 형식으로 쓴다.** 예: PR 제목 `post: '덜 만드는 용기' 발행`.

### PR 제목 lint 워크플로

```yaml
# .github/workflows/commitlint.yml
name: commit lint            # ← 이 이름을 §4 required check에 등록
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
permissions:
  pull-requests: read
jobs:
  pr-title:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            post
            docs
            style
            refactor
            chore
          requireScope: false
          subjectPattern: ^(?!.*\.$).+$   # 제목 끝 마침표 금지 (commitlint과 동일 취지)
```

> (선택) 브랜치의 개별 커밋까지 검사하려면 `wagoid/commitlint-github-action`을 추가할 수 있으나, 스쿼시라 `main`엔 영향이 없다 → **1인이면 PR 제목 검사만으로 충분.**

---

## 7. Vercel 연동

- **Production Branch = `main`** (Vercel 프로젝트 설정 기본값 확인).
- 그 외 모든 브랜치/PR → **자동 프리뷰 배포**(고유 URL, PR에 코멘트로 부착).
- **`post/…` 브랜치는 프리뷰에서 발행 전 최종 교정**(KaTeX·이미지·목차·OG 렌더)에 특히 유용 — 프로덕션에 나가기 전에 실제 화면으로 확인.

---

## 8. 셋업 체크리스트 (1회)

- [ ] GitHub: Squash merge만 허용 + Default 커밋 메시지 = PR 제목 + 머지 후 브랜치 삭제 (§5)
- [ ] GitHub: `main` 보호 — PR 필수, required checks(`commit lint`·`ci`), linear history, **Include administrators** (§4)
- [ ] `.github/pull_request_template.md` (상세 기록 템플릿) 추가 (§3.1)
- [ ] `.github/workflows/commitlint.yml` (PR 제목 lint) 추가 (§6)
- [ ] 로컬 husky `commit-msg` + commitlint (`commit-convention.md §4`)
- [ ] Vercel: Production Branch = `main` 확인 (§7)
