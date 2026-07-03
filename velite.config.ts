import { defineConfig, defineCollection, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { validateSeriesIntegrity } from "./content/lib/validate-series";

// 코드 하이라이트 — design.md §4.4 예외(코드블록 한정): 브랜드 5색 + 종이·이끼의 사촌색 3(문자열=테라코타·숫자=오커·함수=딥틸).
// 컨테이너(--panel/--line/radius)·인라인 칩은 예외 밖 — 여전히 브랜드 토큰.
type Ink = { fg: string; moss: string; stone: string; str: string; num: string; fn: string };
function palette({ fg, moss, stone, str, num, fn }: Ink) {
  return {
    name: "dongcoding",
    type: fg === "#232A22" ? "light" : "dark",
    colors: { "editor.background": "#00000000", "editor.foreground": fg },
    settings: [
      { settings: { foreground: fg } },
      // 주석 — stone italic
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: stone, fontStyle: "italic" } },
      // 핵심 키워드·선언 — moss bold
      { scope: ["keyword", "keyword.control", "storage", "storage.type", "storage.modifier"], settings: { foreground: moss, fontStyle: "bold" } },
      // 타입·태그·언어상수·연산자 — moss (굵기 없음)
      {
        scope: ["support.type", "support.class", "entity.name.type", "entity.name.tag", "constant.language", "keyword.operator"],
        settings: { foreground: moss },
      },
      // 문자열 — 무광 테라코타
      {
        scope: ["string", "string.quoted", "string.template", "constant.character", "constant.other.symbol", "punctuation.definition.string"],
        settings: { foreground: str },
      },
      // 숫자 — 오커
      { scope: ["constant.numeric"], settings: { foreground: num } },
      // 함수·메서드 — 딥틸
      {
        scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function", "variable.function"],
        settings: { foreground: fn },
      },
    ],
  } as const;
}
const codeThemeLight = palette({ fg: "#232A22", moss: "#4F6442", stone: "#6B7163", str: "#9C5A49", num: "#8A6F36", fn: "#2F6F6A" });
const codeThemeDark = palette({ fg: "#E7EADF", moss: "#9BBE84", stone: "#9AA08F", str: "#CF9079", num: "#CBAB63", fn: "#79B8B0" });

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

// About은 MDX가 아닌 TSX+타입 데이터(entities/about/data.ts)로 관리한다 (pages-plan §4).

export default defineConfig({
  // 스키마 층 위반(refine·타입)은 CLI `--strict` 플래그로 빌드를 실패시킨다.
  // config의 strict는 CLI 기본값(false)에 덮어써져 무효이므로 여기 두지 않는다.
  collections: { posts, series },
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      [
        rehypePrettyCode,
        { theme: { light: codeThemeLight, dark: codeThemeDark }, keepBackground: false, defaultColor: false },
      ],
      rehypeKatex,
    ],
  },
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
