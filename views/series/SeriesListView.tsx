import type { SeriesCard as SeriesCardData } from "@/entities/series";
import { SeriesCard } from "@/widgets/series-card";
import { Eyebrow, EmptyState } from "@/shared/ui";
import styles from "./SeriesListView.module.css";

function Group({ title, cards }: { title: string; cards: SeriesCardData[] }) {
  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <Eyebrow>{title}</Eyebrow>
      </div>
      <div className={styles.grid}>
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
