import type { Metadata } from "next";
import { listPublishedPosts, listPopularPosts } from "@/entities/post";
import { HOME_RECENT_COUNT, HOME_POPULAR_COUNT } from "@/shared/config";
import { HomeView } from "@/views/home/HomeView";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export const revalidate = 86400; // 하루 1회 재검증 — 조회수 랭킹 신선도 (pages-plan §1)

export default async function HomePage() {
  const recent = listPublishedPosts().slice(0, HOME_RECENT_COUNT);
  const popular = await listPopularPosts(HOME_POPULAR_COUNT);
  return <HomeView recent={recent} popular={popular} />;
}
