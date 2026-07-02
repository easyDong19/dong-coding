import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getRelated, listPublishedPosts } from "@/entities/post";
import { getSeriesNavForPost, getSeriesDetail } from "@/entities/series";
import { PostView } from "@/views/post-page/PostView";

// 전 발행 글 프리렌더 (draft는 listPublishedPosts에서 제외 → slug 없음)
export function generateStaticParams() {
  return listPublishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.description ?? post.excerpt };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound(); // 없는 slug / draft 직접 접근 (pages-plan §7.1)

  const nav = getSeriesNavForPost(slug);
  const seriesTitle = nav ? (getSeriesDetail(nav.series)?.meta.title ?? nav.series) : null;
  const related = getRelated(slug);

  return <PostView post={post} nav={nav} seriesTitle={seriesTitle} related={related} />;
}
