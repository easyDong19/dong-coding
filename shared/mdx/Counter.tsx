"use client";

import { useState } from "react";

// MDX 인터랙티브 테스트용 클라이언트 컴포넌트 — useState로 실제 상호작용을 확인한다.
// props는 MDX가 넘기는 형태(Record)에 맞춰 느슨하게 받고 안전하게 파싱.
export function Counter(props: Record<string, unknown>) {
  const label = typeof props.label === "string" ? props.label : "클릭 수";
  const [count, setCount] = useState(0);

  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-line text-ink transition-colors hover:border-moss hover:text-moss";

  return (
    <div className="my-6 flex items-center gap-3 rounded-pre border border-line bg-panel p-4">
      <span className="text-sm text-stone">{label}</span>
      <span className="min-w-[2rem] text-center text-lg font-semibold tabular-nums text-ink">
        {count}
      </span>
      <div className="ml-auto flex gap-2">
        <button type="button" className={btn} onClick={() => setCount((n) => n - 1)} aria-label="감소">
          −
        </button>
        <button type="button" className={btn} onClick={() => setCount((n) => n + 1)} aria-label="증가">
          +
        </button>
      </div>
    </div>
  );
}
