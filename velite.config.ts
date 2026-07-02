import { defineConfig, defineCollection, s } from "velite";
import { validateSeriesIntegrity } from "./content/lib/validate-series";

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

// About은 단일 페이지 — MDX 본문에 커스텀 컴포넌트를 주입한다 (pages-plan §4)
const about = defineCollection({
  name: "About",
  pattern: "about.mdx",
  single: true,
  schema: s.object({
    title: s.string().default("About"),
    body: s.mdx(),
  }),
});

export default defineConfig({
  // 스키마 층 위반(refine·타입)은 CLI `--strict` 플래그로 빌드를 실패시킨다.
  // config의 strict는 CLI 기본값(false)에 덮어써져 무효이므로 여기 두지 않는다.
  collections: { posts, series, about },
  prepare: ({ posts, series }) => {
    // 교차 참조 무결성·order 중복은 여기서 throw로 빌드를 막는다 (tech-stack §3.1)
    validateSeriesIntegrity({ posts, series });
    // (c) 연속성 경고: 발행 글 기준 1..N 빈틈이면 console.warn (빌드는 계속)
    for (const s of series) {
      const orders = posts
        .filter((p) => !p.draft && p.series === s.slug)
        .map((p) => p.order!)
        .sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          console.warn(`[series:${s.slug}] order 빈틈/불연속: ${orders.join(",")}`);
          break;
        }
      }
    }
  },
});
