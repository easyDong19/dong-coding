import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/entities/post";
import { listSeriesGrouped, getSeriesDetail } from "@/entities/series";
import { paginate } from "@/shared/pagination/paginate";
import { getSiteUrl, POSTS_PER_PAGE } from "@/shared/config";

// 전체 URL 목록을 검색봇에 제공 (Next 16 metadata file convention). robots.ts가 이 파일을 가리킨다.
// 절대 URL 필수 → getSiteUrl()(env 누락 시 throw). draft는 list 헬퍼에서 자연 배제된다.
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const posts = listPublishedPosts(); // date desc
  const { ongoing, complete } = listSeriesGrouped();
  const seriesSlugs = [...ongoing, ...complete].map((s) => s.slug);

  const newest = posts[0]?.date; // 목록 페이지 lastModified — 최신 글 기준
  const { totalPages } = paginate(posts, 1, POSTS_PER_PAGE);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: newest, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/posts`, lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/series`, lastModified: newest, changeFrequency: "weekly", priority: 0.6 },
    { url: `${site}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // 페이지네이션: 2..totalPages (1은 /posts로 정규화되어 위에서 포함)
  const paginationRoutes: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, i) => ({
      url: `${site}/posts/page/${i + 2}`,
      lastModified: newest,
      changeFrequency: "weekly" as const,
      priority: 0.3,
    }),
  );

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${site}/posts/${p.slug}`,
    lastModified: p.updated ?? p.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = seriesSlugs.map((slug) => {
    const detail = getSeriesDetail(slug);
    // 시리즈 글은 회차(order)순 → 최신 수정일은 max(updated??date)로 계산
    const latest =
      detail?.posts.reduce<string | undefined>((max, p) => {
        const d = p.updated ?? p.date;
        return !max || d > max ? d : max;
      }, undefined) ?? newest;
    return {
      url: `${site}/series/${slug}`,
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...paginationRoutes, ...postRoutes, ...seriesRoutes];
}
