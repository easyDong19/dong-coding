import Link from "next/link";
import type { Post } from "@/entities/post";
import type { SeriesNav as SeriesNavData } from "@/entities/series";
import { Eyebrow } from "@/shared/ui";
import styles from "./SeriesNav.module.css";

// 시리즈 미소속이면 미표시. 첫/마지막 회차는 한쪽 빈자리 유지 (pages-plan §7.1)
export function SeriesNav({
  nav,
  seriesTitle,
}: {
  nav: SeriesNavData<Post> | null;
  seriesTitle: string | null;
}) {
  if (!nav) return null;

  return (
    <nav className={styles.seriesNav} aria-label="시리즈 네비게이션">
      <div className={styles.head}>
        <Eyebrow>{seriesTitle ?? nav.series}</Eyebrow>
        <span className={styles.prog}>
          {nav.index} / {nav.total}
        </span>
      </div>
      <div className={styles.row}>
        {nav.prev ? (
          <Link className={styles.card} href={`/posts/${nav.prev.slug}`}>
            <span className={styles.dir}>이전</span>
            <div className={styles.title}>{nav.prev.title}</div>
          </Link>
        ) : (
          <span className={styles.empty} aria-hidden="true" />
        )}
        {nav.next ? (
          <Link className={`${styles.card} ${styles.next}`} href={`/posts/${nav.next.slug}`}>
            <span className={styles.dir}>다음</span>
            <div className={styles.title}>{nav.next.title}</div>
          </Link>
        ) : (
          <span className={styles.empty} aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
