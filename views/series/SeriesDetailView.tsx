import Image from "next/image";
import { PostList, type Post } from "@/entities/post";
import type { Series } from "@/entities/series";
import { Eyebrow } from "@/shared/ui";
import styles from "./SeriesDetailView.module.css";

export function SeriesDetailView({ meta, posts }: { meta: Series; posts: Post[] }) {
  return (
    <div className="wrap">
      <header className={styles.hero}>
        <Eyebrow>Series</Eyebrow>
        <h1 className={styles.title}>
          {meta.title}
          {meta.complete ? <span className={styles.badge}>완결</span> : null}
        </h1>
        {meta.description ? <p className={styles.desc}>{meta.description}</p> : null}
        {meta.cover ? (
          <Image
            className={styles.cover}
            src={meta.cover.src}
            alt=""
            width={meta.cover.width}
            height={meta.cover.height}
          />
        ) : null}
      </header>
      {/* order 오름차순 + "i/N" 회차 (pages-plan §3.2) */}
      <PostList posts={posts} numbered />
    </div>
  );
}
