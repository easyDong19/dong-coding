import { lightComponents } from "@/shared/mdx/light-components";
import type { MDXComponentMap } from "@/shared/mdx/MDXContent";
import { PostImage } from "@/shared/mdx/PostImage";
import { YouTube } from "@/shared/mdx/YouTube";

// 경량 맵 + (후속) dynamic(ssr:false) 캔버스 위젯 합성 지점 (tech-stack §3.2).
// 캔버스 위젯이 생기면 여기서 dynamic import로 끼운다 — 지금은 경량 맵만.
export const mdxComponents: MDXComponentMap = {
  ...lightComponents,
  img: PostImage,
  YouTube,
};
