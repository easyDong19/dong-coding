# dongCoding — 커밋 컨벤션

> 혼자 관리하는 블로그. **규칙은 최소로, 히스토리는 읽기 쉽게.**
> commitlint로 형식을 기계 검증하고, husky `commit-msg` 훅에서 강제한다.
> 도구 선택 근거는 `tech-stack.md §6.3`. 패키지 매니저는 **pnpm만**(§2.2).

---

## 1. 형식

```
<type>: <제목>

[본문 — 선택]
```

- **`<type>`** — 아래 표의 7개 중 하나. 소문자.
- **`<제목>`** — 한국어 OK. 명령형/간결하게, **끝에 마침표 없음**, 72자 이내.
- **본문(선택)** — "왜"와 "무엇"을 적는다. 제목과 빈 줄로 구분.
- **스코프는 쓰지 않는다.** 1인 프로젝트라 `feat(nav):`처럼 범위를 나눌 실익이 적음 — 제목으로 충분히 전달. (필요해지면 이 규칙부터 바꾼다.)

---

## 2. type 목록

| type | 용도 |
|---|---|
| `feat` | 컴포넌트·레이아웃 등 기능 추가 |
| `fix` | 버그 수정 (KaTeX 깨짐 등) |
| `post` | 새 글 작성·수정 (블로그 전용으로 추가) |
| `docs` | README 등 문서 |
| `style` | 포맷팅·CSS (동작 변화 없음) |
| `refactor` | 리팩터링 |
| `chore` | 설정·의존성·빌드 |

> `post`는 표준 Conventional Commits에 없는 **이 블로그 전용 타입**이다. 콘텐츠 커밋(`content/posts/**`)과 코드 커밋을 히스토리에서 한눈에 구분하려고 둔다. commitlint의 `type-enum`에 명시해야 통과한다(§4).

**경계가 헷갈릴 때**
- 글 본문(`.mdx`) 추가/수정 → **`post`** (설령 오타 하나여도).
- CSS만 바꿨는데 화면이 실제로 달라짐 → `feat` 또는 `fix` (보이는 동작이 바뀌면 `style` 아님).
- 순수 포맷팅·정렬·세미콜론 → `style`.

---

## 3. 예시

```
feat: 시리즈 네비게이션 이전/다음 카드 추가
fix: 다크모드에서 인라인 코드 배경 대비 복구
post: '클로드코드 입문(2) — 스킬과 서브에이전트' 발행
style: styles.css 속성 순서 정리
refactor: getPublishedPosts 정렬 로직을 셀렉터로 분리
chore: commitlint + husky commit-msg 훅 설정
docs: 커밋 컨벤션 문서 추가
```

---

## 4. 셋업 (husky + commitlint)

pnpm 기준. 한 번만 설정하면 이후 모든 커밋에서 자동 검사된다.

```bash
# 1) 의존성 (검증 규칙 + 훅 러너)
pnpm add -D @commitlint/cli @commitlint/config-conventional husky

# 2) husky 초기화 → .husky/ 생성 + package.json "prepare" 스크립트 추가
pnpm exec husky init

# 3) commit-msg 훅 등록 (커밋 메시지를 commitlint로 검사)
echo 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

> `husky init`이 `package.json`에 `"prepare": "husky"`를 넣어준다 → `pnpm install` 시 훅이 자동 복구된다. `commit-msg` 훅은 커밋할 때마다 메시지를 검사해 형식이 틀리면 **커밋을 거부**한다.

### commitlint 설정 — `commitlint.config.mjs`

표준 규칙을 베이스로 깔고, **type만 우리 7개로 제한**한다.

```js
// commitlint.config.mjs
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 우리가 정한 7개 타입만 허용 (표준 + 블로그 전용 'post')
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'post', 'docs', 'style', 'refactor', 'chore'],
    ],
    'type-case': [2, 'always', 'lower-case'], // 타입은 소문자
    'type-empty': [2, 'never'],               // 타입 필수
    'subject-empty': [2, 'never'],            // 제목 필수
    'subject-full-stop': [2, 'never', '.'],   // 제목 끝 마침표 금지
    'header-max-length': [2, 'always', 72],   // 헤더 72자 이내
    // 스코프 안 씀 → config-conventional 기본값이 스코프를 강제하지 않으므로 별도 규칙 불필요
  },
}
```

- 규칙 레벨 `2` = 어기면 **에러(커밋 차단)**, `1` = 경고, `0` = 끔.
- 프로젝트가 ESM(`package.json`에 `"type": "module"`)이므로 설정 파일은 **`.mjs` + `export default`**. CommonJS면 `commitlint.config.cjs` + `module.exports`.

---

## 5. 검증 (설정이 실제로 막는지 확인)

```bash
# 통과해야 함
echo "post: 새 글 초안 추가" | pnpm exec commitlint

# 실패해야 함 (알 수 없는 타입)
echo "wip: 대충 저장" | pnpm exec commitlint
```

두 번째가 `type must be one of [feat, fix, post, ...]`로 거부되면 정상.

---

## 6. 강제는 두 겹 — 로컬 훅 + PR 제목(정본)

이 프로젝트는 **squash merge**를 쓴다(→ `branch-strategy.md §5·§6`). 스쿼시하면 로컬 커밋 메시지는 `main`에 남지 않고 **PR 제목이 `main` 커밋 메시지가 된다.** 그래서 형식 강제 지점이 둘이다:

- **로컬 husky `commit-msg`(§4)** — 조기 피드백 + 로컬 히스토리 정돈용. `--no-verify`로 건너뛸 수 있지만, 어차피 스쿼시되어 `main`엔 안 남으니 치명적이지 않다.
- **PR 제목 lint (CI, required check)** — **진짜 강제 지점.** 형식이 틀리면 **머지 버튼이 잠긴다(우회 불가).** 그러니 **PR 제목을 반드시 이 문서의 형식대로** 쓴다. 예: PR 제목 `post: '덜 만드는 용기' 발행`. (워크플로·설정은 `branch-strategy.md §6`.)

### `--no-verify`?

로컬에서는 막을 수 없다(git이 주는 우회 스위치). **하지만 막을 필요도 없다** — 로컬에서 건너뛰어도 PR 제목 게이트를 통과 못 하면 `main`에 못 들어오기 때문이다. 로컬 훅은 "강제"가 아니라 **"조기 경고"** 로 이해하면 된다.

```bash
git commit -m "wip: 저장" --no-verify   # 로컬에선 통과. 그러나 스쿼시되어 사라지고,
                                         # main 게이트는 PR 제목이 지킨다.
```
