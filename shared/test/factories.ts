export type PostLike = {
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  tags: string[];
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
