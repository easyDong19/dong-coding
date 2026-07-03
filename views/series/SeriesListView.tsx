import type { SeriesCard as SeriesCardData } from "@/entities/series";
import { SeriesCard } from "@/widgets/series-card";
import { Eyebrow, EmptyState } from "@/shared/ui";

function Group({ title, cards }: { title: string; cards: SeriesCardData[] }) {
  return (
    <section className="mb-10">
      <div className="mx-0 mt-0 mb-4">
        <Eyebrow>{title}</Eyebrow>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-[1.2rem]">
        {cards.map((card) => (
          <SeriesCard key={card.slug} card={card} />
        ))}
      </div>
    </section>
  );
}

// 진행 중 먼저, 완결 아래. 빈 그룹은 헤더까지 숨김 (pages-plan §3.1)
export function SeriesListView({
  ongoing,
  complete,
}: {
  ongoing: SeriesCardData[];
  complete: SeriesCardData[];
}) {
  if (ongoing.length === 0 && complete.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          eyebrow="Series"
          message="아직 묶인 시리즈가 없습니다."
          action={{ href: "/posts", label: "전체 글 보기 →" }}
        />
      </div>
    );
  }

  return (
    <div className="wrap">
      {ongoing.length > 0 ? <Group title="진행 중" cards={ongoing} /> : null}
      {complete.length > 0 ? <Group title="완결" cards={complete} /> : null}
    </div>
  );
}
