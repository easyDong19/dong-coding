import { Feed } from "feed";
import { listFeedItems } from "@/entities/post";
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION, SITE_LANGUAGE, SITE_COPYRIGHT } from "@/shared/config";

// 빌드타임 1회 생성 → CDN 정적 서빙 (tech-stack §6.5, Next 16 route-handlers.md §Caching)
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const site = getSiteUrl(); // env 누락 시 throw → 빌드 실패 (fail-fast, test-plan §5.1-4)
  const feed = new Feed({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: site,
    link: site,
    language: SITE_LANGUAGE,
    copyright: SITE_COPYRIGHT,
    feedLinks: { rss: `${site}/feed.xml` },
  });

  for (const item of listFeedItems()) {
    feed.addItem({
      title: item.title,
      id: item.link, // guid = 절대 URL
      link: item.link,
      description: item.description,
      date: new Date(item.date),
    });
  }

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
