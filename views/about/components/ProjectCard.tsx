"use client";

import styles from "./About.module.css";

type Project = { title: string; description: string; href?: string };

// 프로젝트 그리드 — MDX에서 <Projects items={[...]} />로 사용
export function Projects({ items }: { items: Project[] }) {
  return (
    <div className={styles.projects}>
      {items.map((p) => {
        const inner = (
          <>
            <h3 className={styles.projectTitle}>{p.title}</h3>
            <p className={styles.projectDesc}>{p.description}</p>
          </>
        );
        return p.href ? (
          <a key={p.title} className={styles.project} href={p.href}>
            {inner}
          </a>
        ) : (
          <div key={p.title} className={styles.project}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
