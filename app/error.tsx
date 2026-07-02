"use client";

import { EmptyState } from "@/shared/ui";

// 라우트 에러 경계 (pages-plan §7.2) — 스택트레이스 노출 안 함
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap">
      <EmptyState
        role="alert"
        eyebrow="Oops"
        message="dongCoding에 잠시 문제가 생겼습니다."
        onRetry={reset}
        action={{ href: "/", label: "홈으로 →" }}
      />
    </div>
  );
}
