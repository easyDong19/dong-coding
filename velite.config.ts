import { defineConfig, defineCollection, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s.object({
    title: s.string(),
    date: s.isodate(),
    slug: s.slug("post"),
    body: s.mdx(),
  }),
});

export default defineConfig({
  collections: { posts },
});
