import Link from "next/link";
import { PostList, type Post } from "@/entities/post";
import { Eyebrow, EmptyState } from "@/shared/ui";

export function HomeView({ recent, popular }: { recent: Post[]; popular: Post[] }) {
  if (recent.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          eyebrow="dongCoding"
          message="아직 심어둔 글이 없습니다. 곧 첫 잎이 돋아납니다."
          action={{ href: "/about", label: "소개 보기 →" }}
        />
      </div>
    );
  }

  return (
    <div className="wrap">
      {popular.length > 0 && (
        <section className="mb-[2.4rem]">
          <div className="mb-[1.2rem] flex items-baseline gap-[0.7rem]">
            <Eyebrow>가장 많이 본</Eyebrow>
          </div>
          <PostList posts={popular} />
        </section>
      )}
      <section>
        <div className="mb-[1.2rem] flex items-baseline gap-[0.7rem]">
          <Eyebrow>최근 글</Eyebrow>
        </div>
        <PostList posts={recent} />
        <Link className="mx-0 mt-[1.4rem] mb-[0.5rem] inline-block text-sm" href="/posts">
          전체 글 보기 →
        </Link>
      </section>
    </div>
  );
}
