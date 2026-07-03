"use client";

import { useMemo } from "react";
import { Eyebrow } from "@/shared/ui";
import { flattenToc, type TocEntry } from "./lib/flatten-toc";
import { useActiveHeading } from "./model/use-active-heading";
import styles from "./Toc.module.css";

export function Toc({ toc }: { toc: TocEntry[] }) {
  const headings = useMemo(() => flattenToc(toc), [toc]);
  const activeId = useActiveHeading(headings);

  if (headings.length === 0) return null;

  return (
    <nav className={styles.toc} aria-label="목차">
      <Eyebrow>목차</Eyebrow>
      <ol className={styles.list}>
        {headings.map((h) => (
          <li
            key={h.id}
            className={h.depth === 3 ? styles.sub : undefined}
            data-active={h.id === activeId || undefined}
          >
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
