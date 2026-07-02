"use client";

import { EmptyState, LeafSymbols } from "@/shared/ui";
import "./globals.css";

// 루트 레이아웃 자체가 깨졌을 때만 발동 — 자체 <html>/<body>로 셸을 대체 (드묾)
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <LeafSymbols />
        <div className="wrap">
          <EmptyState
            role="alert"
            eyebrow="Oops"
            message="dongCoding에 잠시 문제가 생겼습니다."
            onRetry={reset}
            action={{ href: "/", label: "홈으로 →" }}
          />
        </div>
      </body>
    </html>
  );
}
