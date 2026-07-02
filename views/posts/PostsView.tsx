import { PostList, type Post } from "@/entities/post";
import { Pager } from "@/widgets/pagination";
import { Eyebrow, EmptyState } from "@/shared/ui";
import styles from "./PostsView.module.css";

export function PostsView({
  posts,
  page,
  totalPages,
}: {
  posts: Post[];
  page: number;
  totalPages: number;
}) {
  // 1페이지에 발행 글 0편일 때만 도달(그 외 범위 밖은 라우트에서 notFound) (pages-plan §7.1)
  if (posts.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          eyebrow="Empty"
          message="아직 글이 없습니다."
          action={{ href: "/about", label: "dongCoding 소개 →" }}
        />
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className={styles.head}>
        <Eyebrow>Posts</Eyebrow>
      </div>
      <PostList posts={posts} />
      <Pager current={page} total={totalPages} />
    </div>
  );
}
