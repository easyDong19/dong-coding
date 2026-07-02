import { defineConfig, defineCollection, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s
    .object({
      title: s.string(),
      date: s.isodate(),
      description: s.string().optional(),
      tags: s.array(s.string()).optional(),
      cover: s.image().optional(),
      series: s.string().optional(),
      order: s.number().int().positive().optional(),
      draft: s.boolean().default(false),
      updated: s.isodate().optional(),
      slug: s.slug("post"),
      metadata: s.metadata(),
      toc: s.toc(),
      excerpt: s.excerpt(),
      body: s.mdx(),
    })
    .refine(
      (d) => !d.series || d.order !== undefined,
      "시리즈에 속한 글은 order가 반드시 있어야 합니다",
    ),
});

const series = defineCollection({
  name: "Series",
  pattern: "series/**/*.yml",
  schema: s.object({
    slug: s.slug("series"),
    title: s.string(),
    description: s.string(),
    cover: s.image().optional(),
    order: s.number().int().positive().default(1),
    complete: s.boolean().default(false),
  }),
});

export default defineConfig({
  // 빌드 게이트(스키마 위반 시 실패)는 CLI `--strict` 플래그로 켠다.
  // config의 strict는 CLI 기본값(false)에 덮어써져 무효이므로 여기 두지 않는다.
  collections: { posts, series },
  // prepare 훅은 Task 1.3에서 연결
});
