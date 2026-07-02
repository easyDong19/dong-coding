import Link from "next/link";
import type { Post } from "@/entities/post";
import { Eyebrow } from "@/shared/ui";
import styles from "./Related.module.css";

// 매칭 글 0편이면 섹션 통째 생략 (pages-plan §7.1)
export function Related({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className={styles.related} aria-label="관련 포스팅">
      <Eyebrow>관련 포스팅</Eyebrow>
      <ul className={styles.list}>
        {posts.map((p) => {
          const tags = p.tags ?? [];
          return (
            <li key={p.slug} className={styles.item}>
              <Link href={`/posts/${p.slug}`}>{p.title}</Link>
              {tags.length ? <div className={styles.meta}>{tags.join(" · ")}</div> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
