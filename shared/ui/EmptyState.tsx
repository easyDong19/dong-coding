"use client";

import { useEffect, useRef } from "react";
import { Eyebrow } from "./Eyebrow";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  eyebrow: string;
  message: string;
  sub?: string;
  action?: { href: string; label: string };
  // 에러 상태의 재시도 버튼(reset). onRetry가 있으면 액션 앞에 렌더 (pages-plan §7.2)
  onRetry?: () => void;
  retryLabel?: string;
  // 빈 상태는 status, 에러는 alert + 포커스 이동 (design.md §4.11)
  role?: "status" | "alert";
};

export function EmptyState({
  eyebrow,
  message,
  sub,
  action,
  onRetry,
  retryLabel = "다시 시도",
  role = "status",
}: EmptyStateProps) {
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
      {onRetry || action ? (
        <div className={styles.actions}>
          {onRetry ? (
            <button type="button" className={styles.btn} onClick={onRetry}>
              {retryLabel}
            </button>
          ) : null}
          {action ? (
            <a className={styles.btn} href={action.href}>
              {action.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
