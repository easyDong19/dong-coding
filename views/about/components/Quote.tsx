import type { ReactNode } from "react";

// 인용 히어로 — Notion 인용 블록 스타일: 좌측 moss 바(3px) + tagline(display h1).
// design.md §4.4 blockquote(좌측 moss) 확장. 서체 Pretendard 유지, h1 시맨틱 보존.
export function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="m-0 border-l-[3px] border-moss pl-4">
      <h1 className="m-0 text-balance text-3xl font-semibold leading-[1.3] tracking-[-0.02em] text-ink max-[480px]:text-2xl">
        {children}
      </h1>
    </blockquote>
  );
}
