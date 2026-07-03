"use client";

import { useEffect, useRef } from "react";
import { Eyebrow } from "./Eyebrow";

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
    <div
      ref={ref}
      className="mx-auto max-w-[30rem] px-4 py-20 text-center"
      role={role}
      tabIndex={-1}
    >
      <svg className="h-[2.2rem] w-[2.2rem] text-moss opacity-50" aria-hidden="true">
        <use href="#leaf" />
      </svg>
      <Eyebrow className="mt-4 mb-[0.4rem] block">{eyebrow}</Eyebrow>
      <p className="mb-[0.3rem] text-lg tracking-[-0.02em]">{message}</p>
      {sub ? <p className="mb-[1.4rem] text-sm text-stone">{sub}</p> : null}
      {onRetry || action ? (
        <div className="flex justify-center gap-[0.8rem]">
          {onRetry ? (
            <button
              type="button"
              className="cursor-pointer rounded-pill border border-line bg-transparent px-4 py-[0.4rem] text-sm text-ink [font-family:inherit] [font-weight:inherit] [font-style:inherit] [line-height:inherit] no-underline hover:border-moss hover:text-moss"
              onClick={onRetry}
            >
              {retryLabel}
            </button>
          ) : null}
          {action ? (
            <a
              className="cursor-pointer rounded-pill border border-line bg-transparent px-4 py-[0.4rem] text-sm text-ink [font-family:inherit] [font-weight:inherit] [font-style:inherit] [line-height:inherit] no-underline hover:border-moss hover:text-moss"
              href={action.href}
            >
              {action.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
