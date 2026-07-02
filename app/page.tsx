import { listPublishedPosts } from "@/entities/post";
import { HOME_RECENT_COUNT } from "@/shared/config";
import { HomeView } from "@/views/home/HomeView";

export default function HomePage() {
  const recent = listPublishedPosts().slice(0, HOME_RECENT_COUNT);
  return <HomeView recent={recent} />;
}
