import { posts as raw } from "@/.velite";
import { readTopSlugs } from "@/shared/views";
import { getPublishedPosts, getRelatedPosts, rankToPosts } from "./model/selectors";

// .velite 로드는 오직 이 진입점에서만 (경량 FSD, tech-stack §3.1). 라우트/뷰는 여기 경유.
export function listPublishedPosts() {
  return getPublishedPosts(raw);
}
export function getPostBySlug(slug: string) {
  // draft는 getPublishedPosts에서 제외됨 → 직접 접근 시 null → notFound (pages-plan §7.1)
  return getPublishedPosts(raw).find((p) => p.slug === slug) ?? null;
}
export function getRelated(slug: string) {
  const target = raw.find((p) => p.slug === slug);
  return target ? getRelatedPosts(target, raw) : [];
}
export async function listPopularPosts(n: number) {
  const slugs = await readTopSlugs(n);
  return rankToPosts(slugs, getPublishedPosts(raw)); // 교집합 = draft/삭제 자연 배제
}

// 순수 셀렉터·타입도 계속 재노출(테스트·조합용)
export * from "./model/selectors";
export { PostList } from "./ui/PostList";
export type { Post } from "@/.velite";
