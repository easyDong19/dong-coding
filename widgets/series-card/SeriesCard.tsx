import Link from "next/link";
import type { SeriesCard as SeriesCardData } from "@/entities/series";
import { formatDate } from "@/shared/lib/date";
import styles from "./SeriesCard.module.css";

export function SeriesCard({ card }: { card: SeriesCardData }) {
  return (
    <Link className={styles.card} href={`/series/${card.slug}`}>
      {/* cover는 목록 셀렉터에 없어 --panel 플레이스홀더 (design.md §4.9) */}
      <div className={styles.cover} aria-hidden="true" />
      <div className={styles.body}>
        <h3 className={styles.title}>{card.title}</h3>
        {card.description ? <p className={styles.desc}>{card.description}</p> : null}
        <div className={styles.meta}>
          <span>{card.count}편</span>
          <span className={styles.dot} aria-hidden="true" />
          <time dateTime={card.lastUpdated}>{formatDate(card.lastUpdated)}</time>
        </div>
      </div>
    </Link>
  );
}
