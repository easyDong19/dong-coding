export type TestPost = {
  slug: string;
  title: string;
  date: string;
  draft?: boolean;
  tags?: string[];
  series?: string;
  order?: number;
};

export function makePost(o: Partial<TestPost> = {}): TestPost {
  return { slug: "p", title: "T", date: "2026-01-01", ...o };
}
