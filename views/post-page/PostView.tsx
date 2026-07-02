import Image from "next/image";
import { type Post } from "@/entities/post";
import type { SeriesNav as SeriesNavData } from "@/entities/series";
import { MDXContent } from "@/shared/mdx/MDXContent";
import { SeriesNav } from "@/widgets/series-nav";
import { Related } from "@/widgets/related";
import { TagChip } from "@/shared/ui";
import { formatDate } from "@/shared/lib/date";
import { mdxComponents } from "./lib/mdx-components";
import styles from "./PostView.module.css";

export function PostView({
  post,
  nav,
  seriesTitle,
  related,
}: {
  post: Post;
  nav: SeriesNavData<Post> | null;
  seriesTitle: string | null;
  related: Post[];
}) {
  const tags = post.tags ?? [];

  return (
    <div className={styles.layout}>
      <article className={styles.article}>
        {tags.length ? (
          <div className={styles.tags}>
            {tags.map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        ) : null}
        <h1 className={styles.h1}>{post.title}</h1>
        <div className={styles.byline}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className={styles.dot} aria-hidden="true" />
          <span>{post.metadata.readingTime}분</span>
        </div>
        {post.cover ? (
          <Image
            className={styles.hero}
            src={post.cover.src}
            alt=""
            width={post.cover.width}
            height={post.cover.height}
            priority
          />
        ) : null}

        <div className={styles.body}>
          <MDXContent code={post.body} components={mdxComponents} />
        </div>

        <SeriesNav nav={nav} seriesTitle={seriesTitle} />
        <Related posts={related} />
      </article>
    </div>
  );
}
