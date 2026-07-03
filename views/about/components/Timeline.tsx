import styles from "./About.module.css";

type Item = { when: string; what: string };

export function Timeline({ items }: { items: Item[] }) {
  return (
    <ul className={styles.timeline}>
      {items.map((it) => (
        <li key={`${it.when}-${it.what}`} className={styles.timelineItem}>
          <span className={styles.when}>{it.when}</span>
          {it.what}
        </li>
      ))}
    </ul>
  );
}
