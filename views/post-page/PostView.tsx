import "katex/dist/katex.min.css";
import Image from "next/image";
import { type Post } from "@/entities/post";
import type { SeriesNav as SeriesNavData } from "@/entities/series";
import { MDXContent } from "@/shared/mdx/MDXContent";
import { SeriesNav } from "@/widgets/series-nav";
import { Related } from "@/widgets/related";
import { Toc } from "@/widgets/toc";
import { TagChip } from "@/shared/ui";
import { formatDate } from "@/shared/lib/date";
import { mdxComponents } from "./lib/mdx-components";
import { ViewBeacon } from "./ViewBeacon";

export function PostView({
  post,
  nav,
  seriesTitle,
  related,
  views,
}: {
  post: Post;
  nav: SeriesNavData<Post> | null;
  seriesTitle: string | null;
  related: Post[];
  views: number | null;
}) {
  const tags = post.tags ?? [];

  return (
    <div className="grid grid-cols-[1fr_min(var(--container-reading),100%)_1fr] gap-x-[1.5rem] px-[var(--gutter)] max-[480px]:gap-x-0">
      <ViewBeacon slug={post.slug} />
      <article className="col-[2] pb-8">
        {tags.length ? (
          <div className="flex flex-wrap gap-[0.4rem]">
            {tags.map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        ) : null}
        <h1 className="mx-0 mt-[0.9rem] mb-[0.6rem] text-[clamp(var(--text-2xl),5vw,var(--text-3xl))] font-bold leading-[1.3] tracking-[-0.03em] max-[480px]:leading-[1.25]">
          {post.title}
        </h1>
        <div className="mb-[1.6rem] flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.4rem] text-sm text-stone">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {views !== null ? (
            <>
              <span className="h-[2px] w-[2px] rounded-full bg-stone" aria-hidden="true" />
              <span>조회 {views.toLocaleString()}</span>
            </>
          ) : null}
        </div>
        {post.cover ? (
          <Image
            className="mx-0 mt-[1.2rem] mb-8 block w-full rounded-pre border border-line"
            src={post.cover.src}
            alt=""
            width={post.cover.width}
            height={post.cover.height}
            priority
          />
        ) : null}

        <div className="prose">
          <MDXContent code={post.body} components={mdxComponents} />
        </div>

        <SeriesNav nav={nav} seriesTitle={seriesTitle} />
        <Related posts={related} />
      </article>
      <aside className="col-[3] min-w-0 max-[1100px]:hidden">
        <Toc toc={post.toc} />
      </aside>
    </div>
  );
}
