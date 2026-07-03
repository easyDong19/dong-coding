import Image from "next/image";
import { PostList, type Post } from "@/entities/post";
import type { Series } from "@/entities/series";
import { Eyebrow } from "@/shared/ui";

export function SeriesDetailView({ meta, posts }: { meta: Series; posts: Post[] }) {
  return (
    <div className="wrap">
      <header className="mx-0 mt-6 mb-8">
        <Eyebrow>Series</Eyebrow>
        <h1 className="mx-0 my-[0.4rem] text-2xl font-bold tracking-[-0.03em]">
          {meta.title}
          {meta.complete ? (
            <span className="ml-[0.6rem] rounded-pill bg-moss-soft px-[0.6rem] py-[0.15rem] align-middle text-xs font-medium tracking-[0.02em] text-moss">
              완결
            </span>
          ) : null}
        </h1>
        {meta.description ? <p className="m-0 text-stone">{meta.description}</p> : null}
        {meta.cover ? (
          <Image
            className="mx-0 mt-[1.2rem] mb-0 block w-full rounded-pre border border-line"
            src={meta.cover.src}
            alt=""
            width={meta.cover.width}
            height={meta.cover.height}
          />
        ) : null}
      </header>
      {/* order 오름차순 + "i/N" 회차 (pages-plan §3.2) */}
      <PostList posts={posts} numbered />
    </div>
  );
}
