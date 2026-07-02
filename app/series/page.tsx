import { listSeriesGrouped } from "@/entities/series";
import { SeriesListView } from "@/views/series/SeriesListView";

export default function SeriesPage() {
  const { ongoing, complete } = listSeriesGrouped();
  return <SeriesListView ongoing={ongoing} complete={complete} />;
}
