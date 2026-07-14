import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/.velite";
import { TagChip } from "@/shared/ui";
import { formatDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";
import { pickDek } from "../model/dek";

type Props = {
  post: Post;
  // 시리즈 상세에서 "1/N" 회차 표시 (pages-plan §3.2)
  episode?: string;
};

export function PostListItem({ post, episode }: Props) {
  const dek = pickDek(post);
  const tags = post.tags ?? [];

  return (
    <li className="sprout-item group relative grid grid-cols-[1fr_92px] gap-[1.2rem] border-t border-line py-[1.4rem] first:border-t-0 max-[600px]:grid-cols-1">
      <div>
        <svg className="absolute left-[-1.52rem] top-[1.7rem] h-[0.9rem] w-[0.9rem] text-moss" aria-hidden="true">
          <use href="#leaf" />
        </svg>
        {episode ? (
          <span className="text-xs font-medium tracking-[0.02em] text-moss">{episode}</span>
        ) : null}
        <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[-0.02em]">
          <Link className="text-ink group-hover:text-moss" href={`/posts/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        {dek ? <p className="mx-0 mt-[0.35rem] mb-[0.6rem] text-stone">{dek}</p> : null}
        <div className="flex flex-wrap items-center gap-[0.55rem] text-sm text-stone">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {tags.map((tag) => (
            <TagChip key={tag}>{tag}</TagChip>
          ))}
        </div>
      </div>
      {post.cover ? (
        <Image
          className="mt-[0.2rem] h-16 w-[92px] self-start rounded-pre border border-line bg-panel object-cover max-[600px]:hidden"
          src={post.cover.src}
          alt=""
          width={post.cover.width}
          height={post.cover.height}
        />
      ) : (
        <span
          className={cn(
            "mt-[0.2rem] h-16 w-[92px] self-start rounded-pre border border-line bg-panel object-cover max-[600px]:hidden",
            "invisible",
          )}
          aria-hidden="true"
        />
      )}
    </li>
  );
}
