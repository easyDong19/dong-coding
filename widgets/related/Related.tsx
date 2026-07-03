import Link from "next/link";
import type { Post } from "@/entities/post";
import { Eyebrow } from "@/shared/ui";

// 매칭 글 0편이면 섹션 통째 생략 (pages-plan §7.1)
export function Related({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-8 border-t border-line pt-[1.2rem]" aria-label="관련 포스팅">
      <Eyebrow>관련 포스팅</Eyebrow>
      <ul className="m-0 mt-[0.7rem] list-none p-0">
        {posts.map((p) => {
          const tags = p.tags ?? [];
          return (
            <li key={p.slug} className="border-t border-line py-[0.55rem] first:border-t-0">
              <Link className="font-medium text-ink hover:text-moss" href={`/posts/${p.slug}`}>
                {p.title}
              </Link>
              {tags.length ? <div className="text-sm text-stone">{tags.join(" · ")}</div> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
