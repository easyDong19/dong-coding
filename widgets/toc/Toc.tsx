"use client";

import { useMemo } from "react";
import { Eyebrow } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { flattenToc, type TocEntry } from "./lib/flatten-toc";
import { useActiveHeading } from "./model/use-active-heading";

export function Toc({ toc }: { toc: TocEntry[] }) {
  const headings = useMemo(() => flattenToc(toc), [toc]);
  const activeId = useActiveHeading(headings);

  if (headings.length === 0) return null;

  return (
    <nav
      className="sticky top-[calc(var(--masthead-h)+1.5rem)] max-h-[calc(100vh-var(--masthead-h)-3rem)] overflow-y-auto text-sm"
      aria-label="목차"
    >
      <Eyebrow>목차</Eyebrow>
      <ol className="m-0 mt-[0.6rem] list-none border-l border-line p-0">
        {headings.map((h) => (
          <li key={h.id} className="m-0">
            <a
              className={cn(
                "-ml-px block border-l border-transparent py-1 pl-[0.9rem] leading-[1.5] text-stone no-underline hover:text-ink data-[active]:border-l-moss data-[active]:text-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-2",
                h.depth === 3 && "pl-[1.8rem]",
              )}
              data-active={h.id === activeId || undefined}
              href={`#${h.id}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
