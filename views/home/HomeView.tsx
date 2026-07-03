import Link from "next/link";
import { PostList, type Post } from "@/entities/post";
import { Eyebrow, EmptyState } from "@/shared/ui";

// "가장 많이 본" 섹션은 조회수 플랜 전까지 미노출 — 최근 글이 화면을 지킴 (pages-plan §5.2)
export function HomeView({ recent }: { recent: Post[] }) {
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
