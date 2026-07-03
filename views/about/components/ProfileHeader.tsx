import Image from "next/image";
import styles from "./About.module.css";

// 프로필 히어로 — 이름 없이 role(tagline)을 h1으로 (about 전환 설계 §2)
export function ProfileHeader({
  role,
  src,
  alt,
}: {
  role: string;
  src?: string;
  alt?: string;
}) {
  return (
    <header className={styles.profile}>
      {src ? (
        <Image
          className={styles.avatar}
          src={src}
          alt={alt ?? role}
          width={336}
          height={336}
          priority
        />
      ) : (
        <div className={styles.avatar} aria-hidden="true" />
      )}
      <div className={styles.identity}>
        <h1 className={styles.role}>{role}</h1>
      </div>
    </header>
  );
}
