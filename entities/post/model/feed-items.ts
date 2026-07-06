import type { PostLike } from "@/shared/test/factories";
import { pickDek } from "./dek";

export type FeedItem = {
  title: string;
  link: string; // slug 절대 URL — guid로도 사용
  description?: string;
  date: string; // isodate — route에서 new Date()로 변환
};

/** 발행 글 → RSS 필드 매핑 (test-plan §5.1). draft 제외는 상류 getPublishedPosts 책임. */
export function toFeedItems<T extends PostLike>(posts: T[], siteUrl: string): FeedItem[] {
  return posts.map((p) => ({
    title: p.title,
    link: `${siteUrl}/posts/${p.slug}`,
    description: pickDek(p),
    date: p.date,
  }));
}
