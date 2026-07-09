// 사이트 절대 URL·메타 — RSS(및 향후 sitemap/OG)의 단일 소스.
export const SITE_NAME = "dongCoding";
export const SITE_DESCRIPTION = "코드는 쉽지, 말을 보여줘";
export const SITE_LANGUAGE = "ko";
export const SITE_COPYRIGHT = "© 2026 dongCoding. All rights reserved.";

/**
 * 절대 URL base. env 누락 시 throw(fail-fast) — 깨진 절대 URL이 담긴 RSS가
 * 조용히 배포되느니 빌드를 막는다 (test-plan §5.1-4, 확정 2026-07-02).
 * 끝 슬래시를 제거해 `${getSiteUrl()}/posts/${slug}` 결합이 항상 안전.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL이 필요합니다(RSS 절대 URL). 배포 도메인을 env에 설정하세요.",
    );
  }
  return url.replace(/\/+$/, "");
}
