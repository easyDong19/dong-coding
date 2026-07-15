import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/shared/config";

// 검색봇 크롤링 규칙 + 사이트맵 위치 안내 (Next 16 metadata file convention).
// getSiteUrl()은 env 누락 시 throw → 깨진 절대 URL이 담긴 robots가 배포되느니 빌드를 막는다.
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/", // 조회수 집계 등 내부 엔드포인트는 색인 대상 아님
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
