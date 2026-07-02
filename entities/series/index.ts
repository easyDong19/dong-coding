import { posts as rawPosts, series as rawSeries } from "@/.velite";
import { getSeriesNav, getPostsInSeries, groupSeriesForList } from "./model/selectors";

export function getSeriesNavForPost(slug: string) {
  return getSeriesNav(slug, rawPosts);
}
export function listSeriesGrouped() {
  return groupSeriesForList(rawSeries, rawPosts);
}
export function getSeriesDetail(slug: string) {
  const meta = rawSeries.find((s) => s.slug === slug) ?? null;
  return meta ? { meta, posts: getPostsInSeries(slug, rawPosts) } : null;
}

export * from "./model/selectors";
export type { Series } from "@/.velite";
