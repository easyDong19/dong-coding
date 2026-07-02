import type { PostLike, SeriesLike } from "@/shared/test/factories";

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

export type SeriesCard = {
  slug: string;
  title: string;
  description: string;
  count: number;
  lastUpdated: string;
  complete: boolean;
};

export function groupSeriesForList(
  series: SeriesLike[],
  posts: PostLike[],
): { ongoing: SeriesCard[]; complete: SeriesCard[] } {
  const cards: SeriesCard[] = series
    .map((s) => {
      const members = getPostsInSeries(s.slug, posts); // draft 제외·order 정렬
      if (members.length === 0) return null; // 발행 0편 숨김
      const lastUpdated = members
        .map((p) => p.date)
        .sort() // asc
        .at(-1)!; // 최신
      return {
        slug: s.slug,
        title: s.title,
        description: s.description,
        count: members.length,
        lastUpdated,
        complete: s.complete,
      };
    })
    .filter((c): c is SeriesCard => c !== null)
    .sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1)); // 최신 활동순

  return {
    ongoing: cards.filter((c) => !c.complete),
    complete: cards.filter((c) => c.complete),
  };
}
