export type PostLike = {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  // Velite Post는 tags가 optional(s.array().optional()) — 계약을 그에 맞춘다.
  // 셀렉터는 `tags ?? []`로 방어하므로 없어도 안전하다.
  tags?: string[];
  series?: string;
  order?: number;
  description?: string;
};

export function makePost(o: Partial<PostLike> = {}): PostLike {
  return { slug: "p", title: "T", date: "2026-01-01", draft: false, tags: [], ...o };
}

export type SeriesLike = {
  slug: string;
  title: string;
  description: string;
  order: number;
  complete: boolean;
};

export function makeSeries(o: Partial<SeriesLike> = {}): SeriesLike {
  return { slug: "s", title: "S", description: "", order: 1, complete: false, ...o };
}
