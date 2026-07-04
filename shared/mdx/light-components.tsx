import type { MDXComponentMap } from "./MDXContent";
import { Counter } from "./Counter";

// shared/ui만 참조하는 경량 MDX 컴포넌트 맵 (tech-stack §3.2).
// 기본 요소(h2·p·blockquote·ul·code)는 CSS(PostView 본문 스타일)로 처리한다.
export const lightComponents: MDXComponentMap = {
  Counter,
};
