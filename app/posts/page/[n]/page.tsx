import { notFound, permanentRedirect } from "next/navigation";
import { listPublishedPosts } from "@/entities/post";
import { POSTS_PER_PAGE } from "@/shared/config";
import { paginate } from "@/shared/pagination/paginate";
import { PostsView } from "@/views/posts/PostsView";

// 2..totalPages만 프리렌더 (1은 /posts) (pages-plan §2)
export function generateStaticParams() {
  const { totalPages } = paginate(listPublishedPosts(), 1, POSTS_PER_PAGE);
  const params: { n: string }[] = [];
  for (let n = 2; n <= totalPages; n++) params.push({ n: String(n) });
  return params;
}

export default async function PostsPageN({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const page = Number(n);

  if (page === 1) permanentRedirect("/posts"); // §7.1 정규 URL 통일

  const r = paginate(listPublishedPosts(), page, POSTS_PER_PAGE);
  if (r.outOfRange) notFound(); // §7.1 범위 밖 404

  return <PostsView posts={r.items} page={page} totalPages={r.totalPages} />;
}
