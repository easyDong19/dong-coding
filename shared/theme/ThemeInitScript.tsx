"use client";

import { themeInitScript } from "./theme-init";

/**
 * 렌더 전 테마 반영용 인라인 스크립트(FOUC 방지).
 *
 * 서버 렌더에선 `text/javascript`로 초기 HTML에 실려 파싱 중 동기 실행되고,
 * 클라이언트 렌더에선 `text/plain`(비실행)이라 React가 "데이터 블록"으로 간주해
 * dev의 "Encountered a script tag..." 경고를 내지 않는다. 타입 불일치는
 * `suppressHydrationWarning`으로 흡수 — DOM(서버가 심은 값)이 유지된다.
 *
 * 근거: Next docs `preventing-flash-before-hydration` §Extracting a reusable component.
 */
export function ThemeInitScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
