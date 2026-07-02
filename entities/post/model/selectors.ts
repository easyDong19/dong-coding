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
