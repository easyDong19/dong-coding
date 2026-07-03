import Link from "next/link";
import { getPageItems } from "@/shared/pagination/page-items";
import { cn } from "@/shared/lib/cn";

// 1페이지는 정규 URL /posts, 2페이지부터 /posts/page/n (pages-plan §2)
function href(page: number): string {
  return page === 1 ? "/posts" : `/posts/page/${page}`;
}

export function Pager({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null; // 한 페이지뿐이면 미표시
  const items = getPageItems(current, total);

  const cell = "inline-flex h-[2rem] min-w-[2rem] items-center justify-center rounded-[8px] text-stone";

  return (
    <nav
      className="flex items-center justify-center gap-[0.4rem] mt-10 mb-4 text-sm"
      aria-label="페이지네이션"
    >
      {current > 1 ? (
        <Link className={cn(cell, "hover:text-ink")} href={href(current - 1)} aria-label="이전 페이지">
          ‹
        </Link>
      ) : (
        <span className={cn(cell, "cursor-default opacity-40")} aria-hidden="true">
          ‹
        </span>
      )}

      {items.map((it, i) =>
        it === "…" ? (
          <span key={`ell-${i}`} className={cn(cell, "cursor-default")} aria-hidden="true">
            …
          </span>
        ) : it === current ? (
          <span key={it} className={cn(cell, "bg-moss-soft font-medium text-ink")} aria-current="page">
            {it}
          </span>
        ) : (
          <Link key={it} className={cn(cell, "hover:text-ink")} href={href(it)}>
            {it}
          </Link>
        ),
      )}

      {current < total ? (
        <Link className={cn(cell, "hover:text-ink")} href={href(current + 1)} aria-label="다음 페이지">
          ›
        </Link>
      ) : (
        <span className={cn(cell, "cursor-default opacity-40")} aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}
