"use client";

import Image from "next/image";
import styles from "./About.module.css";

// MDXContent(client)로 주입되므로 client 컴포넌트
export function ProfileHeader({
  name,
  role,
  eyebrow,
  src,
  alt,
}: {
  name: string;
  role: string;
  eyebrow?: string;
  src?: string;
  alt?: string;
}) {
  return (
    <header className={styles.profile}>
      {src ? (
        <Image
          className={styles.avatar}
          src={src}
          alt={alt ?? name}
          width={336}
          height={336}
          priority
        />
      ) : (
        <div className={styles.avatar} aria-hidden="true" />
      )}
      <div className={styles.identity}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.role}>{role}</p>
      </div>
    </header>
  );
}
