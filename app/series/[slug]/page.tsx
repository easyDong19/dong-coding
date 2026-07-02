import { notFound } from "next/navigation";
import { getSeriesDetail, listSeriesGrouped } from "@/entities/series";
import { SeriesDetailView } from "@/views/series/SeriesDetailView";

// 발행 글 있는 시리즈만 프리렌더 (빈/없는 시리즈는 notFound)
export function generateStaticParams() {
  const { ongoing, complete } = listSeriesGrouped();
  return [...ongoing, ...complete].map((s) => ({ slug: s.slug }));
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getSeriesDetail(slug);
  // 없는 slug / 발행 글 0편 → 404 (pages-plan §7.1)
  if (!detail || detail.posts.length === 0) notFound();
  return <SeriesDetailView meta={detail.meta} posts={detail.posts} />;
}
