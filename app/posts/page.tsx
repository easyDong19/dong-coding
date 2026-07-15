import { listPublishedPosts } from "@/entities/post";
import { POSTS_PER_PAGE } from "@/shared/config";
import { paginate } from "@/shared/pagination/paginate";
import { PostsView } from "@/views/posts/PostsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글",
  alternates: { canonical: "/posts" },
};

// /posts = 1페이지(정규 URL) (pages-plan §2)
export default function PostsPage() {
  const { items, totalPages } = paginate(listPublishedPosts(), 1, POSTS_PER_PAGE);
  return <PostsView posts={items} page={1} totalPages={totalPages} />;
}
