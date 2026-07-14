import type { Metadata } from "next";
import { listSeriesGrouped } from "@/entities/series";
import { SeriesListView } from "@/views/series/SeriesListView";

export const metadata: Metadata = {
  title: "시리즈",
  alternates: { canonical: "/series" },
};

export default function SeriesPage() {
  const { ongoing, complete } = listSeriesGrouped();
  return <SeriesListView ongoing={ongoing} complete={complete} />;
}
