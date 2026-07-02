import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/.velite";
import { TagChip } from "@/shared/ui";
import { formatDate } from "@/shared/lib/date";
import styles from "./PostList.module.css";

type Props = {
  post: Post;
  // 시리즈 상세에서 "1/N" 회차 표시 (pages-plan §3.2)
  episode?: string;
};

export function PostListItem({ post, episode }: Props) {
  const dek = post.description ?? post.excerpt;
  const tags = post.tags ?? [];

  return (
    <li className={styles.post}>
      <div>
        <svg className={styles.node} aria-hidden="true">
          <use href="#leaf" />
        </svg>
        {episode ? <span className={styles.episode}>{episode}</span> : null}
        <h3 className={styles.title}>
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>
        {dek ? <p className={styles.dek}>{dek}</p> : null}
        <div className={styles.meta}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className={styles.dot} aria-hidden="true" />
          <span>{post.metadata.readingTime}분</span>
          {tags.map((tag) => (
            <TagChip key={tag}>{tag}</TagChip>
          ))}
        </div>
      </div>
      {post.cover ? (
        <Image
          className={styles.thumb}
          src={post.cover.src}
          alt=""
          width={post.cover.width}
          height={post.cover.height}
        />
      ) : (
        <span className={`${styles.thumb} ${styles.thumbEmpty}`} aria-hidden="true" />
      )}
    </li>
  );
}
