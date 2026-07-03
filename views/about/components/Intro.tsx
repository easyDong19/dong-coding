import styles from "./About.module.css";

// 소개 리드(lede) — ProfileHeader 아래 한두 문장.
export function Intro({ lines }: { lines: string[] }) {
  return (
    <div className={styles.intro}>
      {lines.map((line, i) => (
        <p key={i} className={styles.ledeLine}>
          {line}
        </p>
      ))}
    </div>
  );
}
