# dongCoding — Design System

> 코드와 식물 사이, 천천히 자라는 기록을 위한 블로그 디자인.
> 이 문서는 디자인의 **단일 출처(single source of truth)** 이자, 코딩 에이전트가 일관된 UI를 만들 때 참조하는 컨텍스트입니다.

---

## 1. 디자인 원칙 (Principles)

이 네 가지가 흔들리면 디자인이 무너집니다. 새 컴포넌트를 만들 때 항상 점검하세요.

1. **브랜드 컬러는 5개뿐.** 새로운 색을 추가하지 않습니다. 음영이 필요하면 기존 5색의 **투명도(opacity)** 로만 파생시킵니다. 라이트/다크는 같은 5토큰의 값만 반전한 것이며, 다크는 1급 모드입니다(대충 반전이 아님). *(유일한 예외: 코드 블록 구문 색 — §4.4. UI·레이아웃엔 절대 확장 금지.)*
2. **폰트는 Pretendard 한 종으로 통일.** 본문·UI·eyebrow·강조 라벨까지 전부 Pretendard. **세리프(장식용)는 쓰지 않습니다** — 서체를 섞으면 시선이 분산됩니다. 코드에만 예외적으로 모노스페이스. 강조·라벨은 *서체 전환*이 아니라 **색(moss)·굵기(500)·자간**으로 표현합니다.
3. **줄기와 잎(stem & leaf)이 시그니처.** 글 목록은 한 줄기를 관통하는 잎들로 표현합니다. 이 은유를 장식 아이콘으로 가볍게 흩뿌리지 말고, 구조의 중심에 둡니다.
4. **"글에 집중"이지 "글만"이 아닙니다.** 미니멀의 목표는 산만함(로딩 바·자동재생·소란한 사이드바·무한 진행 표시)을 없애는 것이지 이미지를 금지하는 것이 아닙니다. 커버·그림·도식·수식처럼 **콘텐츠에 복무하는 시각 요소는 환영**합니다. 판단 기준은 하나 — *읽기를 돕는가, 주의를 훔치는가.*

접근성은 협상 대상이 아닌 바닥입니다 — 키보드 포커스, 모션 선호, ARIA는 기본값입니다.

---

## 2. Foundations (토큰)

### 2.0 단위 정책 (Units)

| 대상 | 단위 | 이유 |
|---|---|---|
| font-size · 간격 · 레이아웃(measure/gutter) | **`rem`** | 사용자 브라우저 글자 크기 설정에 반응 → 접근성 |
| 1px 헤어라인 · 작은 radius(5/10px) | **`px`** | 확대 시 번지거나 흐트러지면 안 되는 값 |
| 유동 크기(H1 등) | **`clamp(rem, vw, rem)`** | 뷰포트 기반 유동, 하한·상한은 rem |

> 표기 규칙: 토큰 값은 항상 rem이 원본. 문서의 `px @16`은 root 16px 기준 환산 참고값이며 코드에 넣지 않는다.

### 2.1 컬러

브랜드 5색. **이 외의 색을 도입하지 않습니다.** 각 토큰은 라이트/다크 두 값을 가진다 — 이름은 그대로, 값만 반전.

| 토큰 | Light | Dark | 역할 |
|---|---|---|---|
| `--paper` | `#F4F5EE` | `#14180F` | 종이/배경 (다크: 밤의 숲) |
| `--ink` | `#232A22` | `#E7EADF` | 본문 텍스트 |
| `--moss` | `#4F6442` | `#9BBE84` | 링크·줄기·강조 (다크: 밝은 잎) |
| `--stone` | `#6B7163` | `#9AA08F` | 메타 — 날짜·태그·캡션 |
| `--line` | `#E2E3DA` | `#2B3226` | 헤어라인·구분선 |

위 5색에서 **투명도로만 파생한** 음영 (새 브랜드색 아님). 라이트는 어둡게 깔고(ink wash), 다크는 밝게 띄운다(paper wash):

| 토큰 | Light | Dark | 역할 |
|---|---|---|---|
| `--panel` | `rgba(35,42,34,.045)` | `rgba(231,234,223,.05)` | 코드/패널 배경 |
| `--moss-soft` | `rgba(79,100,66,.10)` | `rgba(155,190,132,.14)` | 태그 칩 배경 |

> **규칙:** 새 배경/강조가 필요하면 `rgba(...)` 파생 토큰을 추가하되, 반드시 위 5색 중 하나에서 나온 값이어야 한다 — **다크 값도 마찬가지.**

**다크모드 구현 — `light-dark()` 방식 (권장):**

토큰 하나에 두 값을 넣고 `color-scheme`로 스위칭. 중복 정의가 없어 유지보수가 깔끔하다(2024 baseline). 컴포넌트 CSS(`.c-key`, blockquote border 등)는 모두 이 토큰을 `var(--…)`로 참조하므로 자동으로 두 모드에 적응한다.

```css
:root{
  color-scheme: light dark;                 /* 두 모드 지원 선언 */
  --paper: light-dark(#F4F5EE, #14180F);
  --ink:   light-dark(#232A22, #E7EADF);
  --moss:  light-dark(#4F6442, #9BBE84);
  --stone: light-dark(#6B7163, #9AA08F);
  --line:  light-dark(#E2E3DA, #2B3226);
  --panel:     light-dark(rgba(35,42,34,.045), rgba(231,234,223,.05));
  --moss-soft: light-dark(rgba(79,100,66,.10), rgba(155,190,132,.14));
}
/* 수동 토글: color-scheme만 바꾸면 light-dark()가 따라감 */
:root[data-theme="light"]{ color-scheme: light }
:root[data-theme="dark"] { color-scheme: dark  }
```

- **무설정 기본값:** `color-scheme: light dark` 덕분에 JS 없이 OS 설정(`prefers-color-scheme`)을 그대로 따른다.
- **영속화(필수):** 사용자의 수동 선택은 **저장해 재방문·재접속 시에도 동일 모드를 적용**한다.
  - **저장:** `localStorage['dc-theme'] = 'light' | 'dark'`. 토글할 때마다 기록한다.
  - **우선순위:** **저장된 선택 > OS 설정.** 저장값이 없을 때만 OS(`prefers-color-scheme`)를 따르고, 그 경우엔 OS 변경도 실시간 반영한다.
  - **FOUC(깜빡임) 방지 — 필수:** `<head>` 최상단에 **렌더 전에** 저장값을 읽어 `document.documentElement`에 `data-theme`를 세팅하는 **인라인 blocking 스크립트**를 둔다(스타일 적용 전에 실행돼야 깜빡임이 없다).
    ```html
    <script>(function(){try{var t=localStorage.getItem('dc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
    ```
  - **SSR 무플래시 대안:** Next.js App Router에선 서버가 localStorage를 못 읽어 하이드레이션 플래시 위험이 있다. 완전 무플래시를 원하면 **선택을 쿠키에도 저장**해 서버에서 `<html data-theme={cookie}>`로 렌더한다. localStorage 단독이면 위 인라인 스크립트 + `<html suppressHydrationWarning>`가 필요하다.
- **레거시 폴백:** `light-dark()` 미지원 브라우저 대응이 필요하면 `@media (prefers-color-scheme: dark)` + `[data-theme]` 이중 정의로 대체.

### 2.2 타이포그래피

| 토큰 | 폰트 | 용도 |
|---|---|---|
| `--sans` | `"Pretendard", system-ui, -apple-system, sans-serif` | **본문·UI·eyebrow·라벨 — 전부** |
| `--mono` | `"JetBrains Mono", ui-monospace, monospace` | 인라인/블록 코드 전용 (기능상 예외) |

> `--serif`(Fraunces)는 **제거**되었습니다. 폰트는 Pretendard로 통일. (§1 원칙 2)

**타입 스케일** — 정규화된 7단계. **rem이 원본 단위**, base = `1rem`(root 16px)에서 ≈1.2배 리듬으로 파생. px 열은 root 16px 기준 환산 참고값일 뿐이다.

> ✅ **확정(2026-07-01):** 프로토타입 렌더 검증 완료. lg(20)·xl(24) 대비와 H1 clamp(30→36) 구간을 포함해 **현행 7단계를 그대로 확정**한다 — 추가 재조정 없음.

| 토큰 | 값 (rem · canonical) | px @16 | 역할 매핑 |
|---|---|---|---|
| `--text-xs`   | `0.75rem`   | 12 | Tag |
| `--text-sm`   | `0.875rem`  | 14 | Meta·byline·nav·eyebrow·caption·code |
| `--text-base` | `1rem`      | 16 | Body |
| `--text-lg`   | `1.25rem`   | 20 | Lede · Post title |
| `--text-xl`   | `1.5rem`    | 24 | Brand name · Article H2 |
| `--text-2xl`  | `1.875rem`  | 30 | Article H1 (하한) |
| `--text-3xl`  | `2.25rem`   | 36 | Article H1 (상한) |

- **Article H1:** `clamp(var(--text-2xl), 5vw, var(--text-3xl))` — 30→36px 유동.
- **본문 크기 — 확정(2026-07-01): 16px (`--text-base: 1rem`).** 17px override(`1.0625rem`)는 채택하지 않는다. base가 7단계 앵커(16px)에서 벗어나지 않도록 스케일을 그대로 유지한다.
- **리팩터링 요약:** 11개 불규칙 사이즈(0.78·0.83·0.86·0.92·0.95·1.0625·1.15·1.18·1.35·clamp(1.7–2.25)rem) → 7단계로 수렴. 12~15px에 몰려 있던 5개 UI 사이즈를 `xs`/`sm`로 통합. 앵커를 16px로 재정렬해 rem 값 전부 정수화.

**weight — 크기와 분리된 의미 속성** (같은 `--text-lg`라도 Lede는 400, Post title은 600):

| weight | 적용 |
|---|---|
| 400 | Body · Lede · Meta · Nav · Code |
| 500 | Nav(active) · **Eyebrow·강조 라벨**(moss) · Code keyword(`.c-key`) |
| 600 | Post title · Brand name · Article H2 |
| 700 | Article H1 |

**line-height·letter-spacing 페어링:**

| 구간 | line-height | letter-spacing |
|---|---|---|
| xs·sm (UI) | 1.4–1.5 | — (Tag/Eyebrow만 `.01em`) |
| base (본문) | 1.78 | `-.005em` |
| lg (리드·제목) | 1.4 / 리드 1.7 | `-.02em` |
| xl (H2·브랜드) | 1.4 | `-.02em` |
| 2xl·3xl (H1) | 1.3 | `-.03em` |

> eyebrow·부제 라벨은 서체 전환 없이 **Pretendard + moss색 + weight 500 + 자간 `.02em`** 로 구분한다(italic·serif 안 씀). 숫자(날짜)에는 `font-variant-numeric: tabular-nums`.

**줄바꿈·문단 다듬기 (한글 조판):**
- 본문은 `word-break: keep-all` — 한글이 어절 중간에서 꺾이지 않게. 긴 URL·토큰의 가로 오버플로는 `overflow-wrap: anywhere`(§2.7)가 흡수하므로 안전.
- 제목(h1–h3)은 `text-wrap: balance`(줄 수 균형), 본문 문단(p·li·figcaption·blockquote)은 `text-wrap: pretty` — 마지막 줄 고아 단어(외톨이) 방지. 미지원 브라우저에선 자동 무시(점진적 향상).

### 2.3 간격 & 레이아웃

| 토큰 | 값 | 용도 |
|---|---|---|
| `--measure` | `39rem` → `48rem`(≥768px) | 컬럼 최대폭 (목록·헤더·푸터) |
| `--gutter` | `clamp(1.25rem, 5vw, 2.5rem)` | 좌우 여백 |
| (reading) | `43rem`(≥768px) | 본문은 가독성 위해 살짝 좁게 |

수직 리듬은 `rem` + `clamp()` 기반. 대표 값: masthead 상단 `clamp(1.75rem, 5vh, 3rem)`(모바일 28 → 데스크탑 48px, 고정 nav 바가 따라오므로 과한 상단 여백은 지양), 섹션 전환 `2.5–3.5rem`.

**레이아웃 안정성 — 스크롤바 거터 (필수):** `html`에 `scrollbar-gutter: stable`을 둔다. 콘텐츠가 짧아 세로 스크롤이 없는 화면에서도 스크롤바 폭만큼 공간을 **항상 예약**해, 페이지 이동·상태 전환으로 콘텐츠 높이가 바뀔 때 스크롤바가 생겼다 사라지며 본문 폭이 흔들리는 **레이아웃 밀림(UI jank)** 을 없앤다.

```css
html{ scrollbar-gutter: stable; }
```

> **`overflow-y: scroll`이 아니라 `scrollbar-gutter`인 이유:** 후자는 스크롤이 불필요할 때 **빈 스크롤바 트랙을 강제로 그리지 않아**(공간만 예약) 더 깔끔하다 — 원칙 4("산만함 배제")와 정합. macOS 오버레이 스크롤바(공간 미점유) 환경에선 효과가 안 보일 수 있으나, 스크롤바가 폭을 차지하는 환경(Windows·Linux·macOS '항상 표시' 설정)에서 jank가 제거된다.

### 2.4 모서리 반경 (Radius)

| 용도 | 값 |
|---|---|
| 인라인 코드 | `5px` |
| 코드 블록 (`pre`) | `10px` |
| 태그 칩 (pill) | `999px` |
| 포커스 링 | `2px` |

### 2.5 테두리 (Borders)

- 헤어라인: `1px solid var(--line)` — 구분선, 포스트 경계, 코드 블록
- 인용구: `2px solid var(--moss)` 좌측
- 포커스: `2px solid var(--moss)`, `outline-offset: 3px`

### 2.6 모션

- **잎 등장(sprout):** `.55s cubic-bezier(.22,1,.36,1)`, 노드별 stagger `.05 / .13 / .21 / .29 / .37s`
- **반드시 `@media (prefers-reduced-motion: no-preference)` 안에서만 정의.** 모션 비선호 사용자는 애니메이션 0.

### 2.7 브레이크포인트 & 반응형 (모바일 안전)

**퍼블리싱 순서:** 모바일 → 태블릿 → 데스크탑. 좁은 화면의 "글에 집중" 경험이 기준이고, 데스크탑은 여백·목차를 얹어 확장한다.

**최소 지원 뷰포트: `320px`까지 안 깨진다** — iPhone SE(1세대 `320×568`, 2/3세대 `375×667`) 포함. 어떤 뷰포트에서도 **가로 스크롤·요소 잘림·겹침이 없어야** 한다.

| 분기 | 변화 |
|---|---|
| 기본(모바일 우선) | 단일 컬럼, body `1rem`, gutter 최소 `1.25rem`(20px) |
| `≤480px` | 줄기 들여쓰기 축소, series-nav 이전/다음 **세로 스택**, byline 등 메타 `flex-wrap:wrap` |
| `≥768px` | `--measure: 48rem`, reading wrap `43rem` |
| `≥1100px` | 따라다니는 목차 노출 (그 아래는 **숨김**) |
| `≥1280px` | 뷰포트 프레임 `min-width: 1280` 적용 (그 아래는 **유동** — 프레임 강제 폭 없음) |

**모바일에서 절대 깨지지 않기 위한 규칙 (필수):**
- **뷰포트 프레임 `min-width: 1280`은 데스크탑(≥1280px)에서만 적용.** 태블릿·모바일에 강제하면 가로 스크롤이 생기므로 그 아래는 유동으로 둔다. (요구사항의 "1280~1920 프레임"은 데스크탑 표현이며, 그 아래는 반응형)
- **가로 오버플로 금지 — 긴 요소는 페이지가 아니라 자기 안에서 스크롤:**
  - 코드블록 `pre` · 표: `overflow-x: auto`
  - display 수식: `.katex-display{ overflow-x: auto }`
  - 긴 URL·단어: `overflow-wrap: anywhere`
- **미디어 상한:** `img`·`figure`·비디오는 `max-width: 100%`.
- **따라다니는 목차는 `≤1100px` 숨김** — 모바일에서 본문 폭을 침범하지 않는다.
- **터치 타깃:** 인터랙티브 요소 최소 `44×44px` 권장(접근성).
- **검증 기준:** 320px 포함 전 구간에서 `document.documentElement.scrollWidth ≤ clientWidth`(가로 스크롤 0)를 유지.

---

## 3. 시그니처 모티프 (Signature)

디자인의 정체성. 함부로 바꾸지 마세요.

- **줄기(stem):** 글 목록 `ol`을 관통하는 세로 `1px` 라인 (`var(--line)`). `::before`로 구현.
- **잎(node):** 각 글 = 줄기에 달린 한 장의 잎. `#leaf` SVG 심볼(outline) 사용.
- **잎 모양 불릿:** 본문 리스트의 불릿은 점이 아니라 잎 — `border-radius: 50% 0 50% 50%` + `rotate(45deg)`, `var(--moss)`.
- **¶ 마커:** Article H2 앞에 moss 색 `¶`.
- **푸터 잎:** `#leaf-fill` (채워진 잎)로 마무리.

SVG 잎은 `<symbol>`로 한 번 정의 후 `<use>`로 재사용합니다.

---

## 4. Components

각 컴포넌트의 해부(anatomy)와 상태(states).

### 4.1 Masthead (머리글)
- **구성:** brand(잎 + 이름 + Pretendard 부제, stone) · lede(도입문, muted 2번째 줄) · nav(Home/Posts/Series/About/RSS)
- **상태:** nav 링크는 stone, `aria-current="page"` 시 ink + weight 500.

### 4.2 Post Index (글 목록)
- **구성:** index-head(eyebrow "Latest" + count "N편") · `ol.stem` · `li.post` × N
- **`li.post` 해부:** node(잎) · title · dek(요약) · meta(time · dot · 읽기시간 · tag…)
- **커버 썸네일(변형):** 포스트에 `cover`가 있으면 잎 노드 옆에 작고 차분한 썸네일(작은 radius `10px`, `--line` 헤어라인). **줄기-잎 텍스트 구조가 주(主), 썸네일은 종(從)** — 커버 없는 글과 목록 리듬이 깨지지 않도록 썸네일 자리는 고정 폭으로 예약. 집중을 해치지 않는 선에서만 노출.
- **상태:** hover/focus 시 title이 ink → moss. 포스트 간 경계는 상단 `1px` 라인.
- **Tag 칩:** moss 텍스트 + `--moss-soft` 배경 + pill.

### 4.3 Preview Separator (구분)
- 중앙 정렬 eyebrow, 양옆에 `34px × 1px` 라인 (`::before/::after`).

### 4.4 Reading Article (읽기 화면)
- **구성:** post-tag · H1 · byline · 본문(p / H2 / blockquote / ul / code / figcaption)
- **인용구:** 좌측 moss `2px`, 텍스트 stone.
- **코드:** 인라인은 `--panel` 배경 칩, 블록은 `--panel` + `--line` 테두리 + `10px` radius. **컨테이너·인라인 칩은 브랜드 5색 그대로.**
  - **구문 색 — §2.1 5색 원칙의 유일한 예외(코드 블록 토큰 전경색 한정).** 가독성을 위해 종이·이끼 팔레트의 *사촌색* 3개를 더한다. 형광 금지, 저채도만. 배경/테두리/인라인 칩엔 적용하지 않는다.
  - 키워드·선언 = **moss**(bold) · 타입·태그·연산자 = moss · 주석 = **stone** italic · 기본/식별자 = **ink**
  - 문자열 = **무광 테라코타** `#9C5A49`(L) / `#CF9079`(D) · 숫자 = **오커** `#8A6F36`(L) / `#CBAB63`(D) · 함수 = **딥틸** `#2F6F6A`(L) / `#79B8B0`(D)
  - 구현: `velite.config.ts`의 커스텀 shiki dual 테마(`palette()`). 빌드타임 렌더라 런타임 JS 0.
- **리스트:** 잎 모양 불릿(위 §3).

### 4.5 목차 (TOC) — 읽기 화면 보조
> 동작·데이터는 `tech-stack.md §5.1`("은은한 보조"), 여기선 시각 해부만.
- **구성:** eyebrow "목차"(moss·500) + `ol`(무불릿). 좌측 `1px` 라인(`--line`)이 기준선.
- **배치:** 데스크탑에서 `--reading` 바깥 여백에 `position:sticky`. **`≤1100px`에선 숨김.** 톤은 저대비 stone, 애니메이션 없음(원칙 1 "은은한 보조 — 주의를 훔치지 않음").
- **상태:** 링크 기본 stone(opacity 낮게) → hover ink → **현재 섹션(active)은 moss + 좌측 라인 moss.** active 판정은 IntersectionObserver(스크롤 폴링 없음).
- **데이터:** Velite `s.toc()` 빌드타임(런타임 파싱 없음).
- **접근성:** `aria-label="목차"`.

### 4.6 Series Nav (시리즈 네비게이션) — 본문 하단
> 데이터·정책은 `tech-stack.md §5.2`, 빈 상태 규칙은 `pages-plan.md §7.1`.
- **구성:** head(시리즈명 moss·500 + 진행 "N / M") · row(이전/다음 카드 2열).
- **배치:** 사이드가 아니라 **본문이 끝난 하단**(읽는 중엔 안 보여 집중을 안 해침). 상단 `1px` 라인.
- **상태:** 카드 hover 시 border moss. **첫 회차 → 이전 자리 빈칸 유지, 마지막 회차 → 다음 자리 빈칸.** 시리즈 소속이 아니면 컴포넌트 **미표시.** `≤480px`에서 이전/다음 **세로 스택**.
- **데이터:** `getSeriesNav(postSlug)` → `{series, index, total, prev, next}`.

### 4.7 관련 포스팅 (Related) — 본문 하단
- **구성:** eyebrow "관련 포스팅"(moss·500) + `ul`(항목마다 상단 `1px` 라인) — 제목 링크 + 메타(태그, stone).
- **상태:** hover 시 제목 ink → moss. **매칭 글 0편이면 섹션을 통째로 생략**(`pages-plan.md §7.1`).
- **데이터:** 태그 기반 관련 글 계산 — 자기 자신 제외, **같은 시리즈 글은 제외하지 않음**(정책·근거는 `tech-stack.md §5.2`).

### 4.8 Pagination (페이지네이션)
> 동작·정책은 `pages-plan.md §2`.
- **구성:** 중앙 정렬 숫자 페이저 `‹ 1 2 3 … M ›`. 사이드 요소가 아니라 목록 **하단 고정**.
- **상태:** 현재 페이지는 ink + weight 500 + `--moss-soft` 배경, 나머지 stone → hover ink. `…`(생략)은 비인터랙티브. radius `8px`.
- **접근성:** `<nav aria-label="페이지네이션">`, 현재 페이지 `aria-current="page"`.

### 4.9 Series Card (시리즈 카드)
> 그룹핑·완결 정책은 `pages-plan.md §3.1`.
- **구성:** cover(`s.image`, `16/9`; 없으면 `--panel` 플레이스홀더, `--line` 하단 헤어라인) · title · description(stone) · meta("N편" · dot · 최신 업데이트일).
- **배치:** `series-grid`(auto-fill `minmax(15rem, 1fr)`). `/series`는 **진행 중 / 완결 두 그룹**, 빈 그룹은 헤더까지 숨김. 완결 시리즈는 상세 히어로에 "완결" 배지(moss·`--moss-soft` pill).
- **상태:** hover 시 border moss. 카드 radius `10px`, `--line` 헤어라인.

### 4.10 About 컴포넌트 (ProfileHeader · Timeline · ProjectCard)
> 소스는 `entities/about/data.ts`(TSX+타입 데이터)를 `views/about/` 컴포넌트가 직접 렌더(`pages-plan.md §4`).
- **ProfileHeader:** avatar(정사각 radius `14px`, `--panel`) + 한 줄 소개(role: Pretendard · stone · weight 500, `h1`). 이름 h1 없이 role을 h1으로 둔다. "글에 집중" 원칙상 사진은 콘텐츠에 복무하므로 환영.
- **Timeline (이력):** §3 **줄기-잎 모티프 재사용** — 세로 `1px` 라인(`--line`) + 잎 불릿(moss). 연도 `when`은 `tabular-nums`.
- **ProjectCard:** `projects` 그리드(auto-fill `minmax(14rem, 1fr)`) — 제목 · 설명(stone) · 링크. hover 시 border moss, radius `10px`.
- **모션:** About은 §2.6 sprout 등장 애니메이션을 **의도적으로 적용하지 않는다**(정적 진입). sprout는 posts 목록 등 다른 곳에서 계속 사용.

### 4.11 Empty / Error State (빈·에러 공통)
> 화면별 조건·문구는 `pages-plan.md §7`. 여기선 공통 anatomy만.
- **구성:** 잎 1개(`#leaf` outline, muted opacity) + eyebrow(Pretendard · moss · 500) + 한 줄 메시지(lg) + 부제(stone, 선택) + 액션 링크 1개. **스피너·애니메이션·삽화 없음**(원칙 4: 산만함 배제).
- **배치:** 중앙 정렬, 좁은 폭(~30rem). 버튼은 `--line` 테두리 pill, hover 시 moss.
- **상태:** 빈 상태 `role="status"`, 에러 `role="alert"` + 포커스 이동. 404/500은 명확성 우선(시적 표현은 보조).

### 4.12 Footer (바닥글)
- 상단 `1px` 라인. row: 시그니처(채운 잎 + 문구) ↔ meta-links(RSS/GitHub/메일).

---

## 5. 접근성 (Accessibility)

- `:focus-visible` — 모든 인터랙티브 요소에 moss `2px` 아웃라인 + offset.
- `prefers-reduced-motion` — 모든 애니메이션은 이 가드 안에서만.
- 장식 SVG는 `aria-hidden="true"`, `nav`/`section`엔 `aria-label`, 현재 페이지엔 `aria-current`.
- 본문 색 대비: ink on paper는 라이트/다크 모두 WCAG AA 충족 (다크 `#E7EADF` on `#14180F` ≈ 15:1, moss 링크 `#9BBE84` ≈ 9:1, stone 메타 `#9AA08F` ≈ 6.8:1 / 라이트 moss `#4F6442` ≈ 5.9:1, stone `#6B7163` ≈ 4.6:1). **stone 라이트는 `#6B7163`로 확정(2026-07-03)** — 구 `#7C8275`는 3.6:1로 14px 메타 텍스트 AA(4.5:1) 미달이라 조정. 색상(초록기 회색)은 유지, 명도만 낮춤.
- 다크모드: `<meta name="color-scheme" content="light dark">`로 폼 컨트롤·스크롤바까지 모드에 맞춤. 토글 UI엔 `aria-pressed` 또는 `aria-label`.

---

## 6. Do / Don't (제약)

코딩 에이전트와 협업 시 이 규칙을 위반하지 마세요.

| ✅ Do | ❌ Don't |
|---|---|
| 5색 + 투명도 파생만 사용 | 새 hex 브랜드색 추가 |
| 다크 값도 5토큰 반전으로만 | 다크에서 임의 색 신설·순수 검정(`#000`) 배경 |
| 폰트는 Pretendard 한 종 (코드만 mono) | serif 등 다른 서체 섞기 |
| 강조·라벨은 색·굵기·자간으로 | 라벨에 서체 전환(italic/serif) |
| 색·간격은 토큰(`var(--…)`)으로 | CSS에 hex/매직넘버 하드코딩 |
| 폰트 크기는 `--text-*` 7단계만 | 임의 `rem`/`px` 폰트 크기 신설 |
| 모션은 `prefers-reduced-motion` 가드 안에 | 가드 없는 무조건 애니메이션 |
| 줄기-잎 은유를 구조 중심에 | 잎 아이콘을 장식으로 남발 |
| 날짜에 `tabular-nums` | 비례폭 숫자로 날짜 정렬 깨기 |
| `html`에 `scrollbar-gutter: stable`로 스크롤바 공간 예약 | 페이지마다 스크롤바 유무로 본문 폭 흔들리기(레이아웃 밀림) |
