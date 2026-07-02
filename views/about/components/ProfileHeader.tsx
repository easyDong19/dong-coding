"use client";

import styles from "./About.module.css";

// MDXContent(client)로 주입되므로 client 컴포넌트
export function ProfileHeader({ name, role }: { name: string; role: string }) {
  return (
    <div className={styles.profile}>
      <div className={styles.avatar} aria-hidden="true" />
      <div>
        <h1 className={styles.name}>{name}</h1>
        <p className={styles.role}>{role}</p>
      </div>
    </div>
  );
}
