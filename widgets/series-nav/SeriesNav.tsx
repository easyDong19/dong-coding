import Link from "next/link";
import type { Post } from "@/entities/post";
import type { SeriesNav as SeriesNavData } from "@/entities/series";
import { Eyebrow } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

// 시리즈 미소속이면 미표시. 첫/마지막 회차는 한쪽 빈자리 유지 (pages-plan §7.1)
export function SeriesNav({
  nav,
  seriesTitle,
}: {
  nav: SeriesNavData<Post> | null;
  seriesTitle: string | null;
}) {
  if (!nav) return null;

  const card = "block rounded-pre border border-line px-[0.9rem] py-[0.7rem] text-ink hover:border-moss";

  return (
    <nav className="mt-10 border-t border-line pt-[1.2rem]" aria-label="시리즈 네비게이션">
      <div className="mb-[0.8rem] flex items-baseline gap-[0.6rem]">
        <Eyebrow>{seriesTitle ?? nav.series}</Eyebrow>
        <span className="text-sm text-stone">
          {nav.index} / {nav.total}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-[0.8rem] max-[480px]:grid-cols-1">
        {nav.prev ? (
          <Link className={card} href={`/posts/${nav.prev.slug}`}>
            <span className="text-xs text-stone">이전</span>
            <div className="mt-[0.15rem]">{nav.prev.title}</div>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {nav.next ? (
          <Link className={cn(card, "text-right")} href={`/posts/${nav.next.slug}`}>
            <span className="text-xs text-stone">다음</span>
            <div className="mt-[0.15rem]">{nav.next.title}</div>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
