import type { Post } from "@/.velite";
import { PostListItem } from "./PostListItem";
import styles from "./PostList.module.css";

type Props = {
  posts: Post[];
  // true면 각 항목에 "i/N" 회차 표시 (시리즈 상세)
  numbered?: boolean;
};

export function PostList({ posts, numbered }: Props) {
  return (
    <ol className={styles.stem}>
      {posts.map((post, i) => (
        <PostListItem
          key={post.slug}
          post={post}
          episode={numbered ? `${i + 1}/${posts.length}` : undefined}
        />
      ))}
    </ol>
  );
}
