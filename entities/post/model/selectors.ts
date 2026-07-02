import type { PostLike } from "@/shared/test/factories";

export function getPublishedPosts(posts: PostLike[]): PostLike[] {
  return posts
    .filter((p) => !p.draft)
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? a.slug.localeCompare(b.slug) // tie-break: slug asc
        : a.date < b.date
          ? 1
          : -1, // date desc
    );
}

export function getRelatedPosts(target: PostLike, posts: PostLike[], limit = 5): PostLike[] {
  const targetTags = new Set(target.tags ?? []);
  if (targetTags.size === 0) return [];

  const scored = getPublishedPosts(posts) // draft 제외 + 결정적 정렬
    .filter((p) => p.slug !== target.slug) // 자기 자신 제외
    .map((p) => ({ p, overlap: (p.tags ?? []).filter((t) => targetTags.has(t)).length }))
    .filter((x) => x.overlap > 0); // 시리즈 여부로 분기하지 않음

  return scored
    .sort((a, b) => b.overlap - a.overlap) // 겹침 내림차순; 동점은 date/slug 정렬 유지(안정 정렬)
    .slice(0, limit)
    .map((x) => x.p);
}
