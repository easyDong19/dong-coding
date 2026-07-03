import type { Post } from "@/.velite";
import { PostListItem } from "./PostListItem";

type Props = {
  posts: Post[];
  // true면 각 항목에 "i/N" 회차 표시 (시리즈 상세)
  numbered?: boolean;
};

export function PostList({ posts, numbered }: Props) {
  return (
    <ol className="relative m-0 list-none py-0 pr-0 pl-[1.7rem] before:absolute before:left-[0.32rem] before:top-[0.6rem] before:bottom-[0.6rem] before:w-px before:bg-line before:content-[''] max-[480px]:pl-[1.2rem]">
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
