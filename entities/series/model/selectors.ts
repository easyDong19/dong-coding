import type { PostLike } from "@/shared/test/factories";

export type SeriesNav = {
  series: string;
  index: number;
  total: number;
  prev: PostLike | null;
  next: PostLike | null;
};

export function getSeriesNav(postSlug: string, posts: PostLike[]): SeriesNav | null {
  const target = posts.find((p) => p.slug === postSlug);
  if (!target || !target.series || target.draft) return null;

  const ordered = posts
    .filter((p) => !p.draft && p.series === target.series && p.order !== undefined)
    .sort((a, b) => a.order! - b.order!);

  const i = ordered.findIndex((p) => p.slug === postSlug);
  if (i === -1) return null;

  return {
    series: target.series,
    index: i + 1, // 정렬 위치 (order 값 아님)
    total: ordered.length,
    prev: i > 0 ? ordered[i - 1] : null,
    next: i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}

export function getPostsInSeries(seriesSlug: string, posts: PostLike[]): PostLike[] {
  return posts
    .filter((p) => !p.draft && p.series === seriesSlug && p.order !== undefined)
    .sort((a, b) => a.order! - b.order!);
}
