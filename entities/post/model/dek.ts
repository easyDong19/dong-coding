import type { PostLike } from "@/shared/test/factories";

/** 목록 dek·RSS description 공용 폴백: description 우선, 없으면 excerpt (test-plan §5.1-1·2, content-plan §1.4). */
export function pickDek(post: Pick<PostLike, "description" | "excerpt">): string | undefined {
  return post.description ?? post.excerpt;
}
