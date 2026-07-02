import Link from "next/link";
import { getPageItems } from "@/shared/pagination/page-items";
import styles from "./Pager.module.css";

// 1페이지는 정규 URL /posts, 2페이지부터 /posts/page/n (pages-plan §2)
function href(page: number): string {
  return page === 1 ? "/posts" : `/posts/page/${page}`;
}

export function Pager({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null; // 한 페이지뿐이면 미표시
  const items = getPageItems(current, total);

  return (
    <nav className={styles.pager} aria-label="페이지네이션">
      {current > 1 ? (
        <Link href={href(current - 1)} aria-label="이전 페이지">
          ‹
        </Link>
      ) : (
        <span className={styles.disabled} aria-hidden="true">
          ‹
        </span>
      )}

      {items.map((it, i) =>
        it === "…" ? (
          <span key={`ell-${i}`} className={styles.ell} aria-hidden="true">
            …
          </span>
        ) : it === current ? (
          <span key={it} className={styles.current} aria-current="page">
            {it}
          </span>
        ) : (
          <Link key={it} href={href(it)}>
            {it}
          </Link>
        ),
      )}

      {current < total ? (
        <Link href={href(current + 1)} aria-label="다음 페이지">
          ›
        </Link>
      ) : (
        <span className={styles.disabled} aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}
