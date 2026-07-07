import { getPostBySlug, listPublishedPosts } from "@/entities/post";
import { renderBrandCard, renderCoverCard, OG_SIZE, OG_CONTENT_TYPE } from "@/shared/og";
import { SITE_NAME } from "@/shared/config";

// 전 발행 글을 빌드타임 PNG로 고정(page.tsx와 동일 목록 → 공유 시 런타임 생성 0).
export function generateStaticParams() {
  return listPublishedPosts().map((p) => ({ slug: p.slug }));
}

// 이미지 메타(alt·size·contentType)를 글마다 동적으로 — alt를 글 제목으로.
export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return [{ id: "og", alt: post?.title ?? SITE_NAME, size: OG_SIZE, contentType: OG_CONTENT_TYPE }];
}

// 라우트는 얇게 — 글 조회 후 cover/폴백 분기만. 렌더링은 shared/og에 위임.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return renderBrandCard(); // 방어: 없는 slug → 사이트 기본 카드
  if (post.cover) return renderCoverCard(post.cover.src); // cover 우선(§6.6)
  return renderBrandCard(post.title); // 텍스트 폴백
}
