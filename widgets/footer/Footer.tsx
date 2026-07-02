import styles from "./Footer.module.css";

// RSS·GitHub·메일 링크는 후속(RSS/OG) 플랜에서 실제 URL 연결
export function Footer() {
  return (
    <footer className={`${styles.footer} wrap`}>
      <span className={styles.sig}>
        <svg className={styles.leaf} aria-hidden="true">
          <use href="#leaf-fill" />
        </svg>
        dongCoding에서 천천히
      </span>
      <span className={styles.links}>
        <a href="#">RSS</a>
        <a href="#">GitHub</a>
        <a href="#">메일</a>
      </span>
    </footer>
  );
}
