import Link from "next/link";
import type { SeriesCard as SeriesCardData } from "@/entities/series";
import { formatDate } from "@/shared/lib/date";

export function SeriesCard({ card }: { card: SeriesCardData }) {
  return (
    <Link
      className="flex flex-col overflow-hidden rounded-pre border border-line text-inherit hover:border-moss"
      href={`/series/${card.slug}`}
    >
      {/* cover는 목록 셀렉터에 없어 --panel 플레이스홀더 (design.md §4.9) */}
      <div className="aspect-video border-b border-line bg-panel" aria-hidden="true" />
      <div className="px-4 pt-[0.9rem] pb-[1.1rem]">
        <h3 className="m-0 mb-[0.3rem] text-lg font-semibold tracking-[-0.02em]">{card.title}</h3>
        {card.description ? (
          <p className="m-0 mb-[0.6rem] text-sm text-stone">{card.description}</p>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-stone">
          <span>{card.count}편</span>
          <span className="h-[2px] w-[2px] rounded-full bg-stone" aria-hidden="true" />
          <time dateTime={card.lastUpdated}>{formatDate(card.lastUpdated)}</time>
        </div>
      </div>
    </Link>
  );
}
