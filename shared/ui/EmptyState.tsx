"use client";

import { useEffect, useRef } from "react";
import { Eyebrow } from "./Eyebrow";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  eyebrow: string;
  message: string;
  sub?: string;
  action?: { href: string; label: string };
  // 빈 상태는 status, 에러는 alert + 포커스 이동 (design.md §4.11)
  role?: "status" | "alert";
};

export function EmptyState({ eyebrow, message, sub, action, role = "status" }: EmptyStateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role === "alert") ref.current?.focus();
  }, [role]);

  return (
    <div ref={ref} className={styles.state} role={role} tabIndex={-1}>
      <svg className={styles.leaf} aria-hidden="true">
        <use href="#leaf" />
      </svg>
      <Eyebrow className={styles.eyebrow}>{eyebrow}</Eyebrow>
      <p className={styles.msg}>{message}</p>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
      {action ? (
        <div className={styles.actions}>
          <a className={styles.btn} href={action.href}>
            {action.label}
          </a>
        </div>
      ) : null}
    </div>
  );
}
