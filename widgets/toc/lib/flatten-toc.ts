export type TocEntry = { title: string; url: string; items: TocEntry[] };

export type FlatHeading = { id: string; text: string; depth: 2 | 3 };

/** Velite s.toc() 중첩 트리 → H2·H3 평탄 배열(문서 순서 보존). H4+ 는 버린다. */
export function flattenToc(entries: TocEntry[]): FlatHeading[] {
  const out: FlatHeading[] = [];
  for (const h2 of entries) {
    out.push({ id: h2.url.replace(/^#/, ""), text: h2.title, depth: 2 });
    for (const h3 of h2.items) {
      out.push({ id: h3.url.replace(/^#/, ""), text: h3.title, depth: 3 });
    }
  }
  return out;
}
