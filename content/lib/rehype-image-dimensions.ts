import sharp from "sharp";
import { basename } from "node:path";
import { assets } from "velite";

export interface RehypeImageDimensionsOptions {
  /** src(=/static/hash.ext) → 원본 절대경로. 기본은 Velite assets 맵 역참조. 테스트용 주입 지점. */
  resolve?: (src: string) => string | undefined;
}

// 외부 순회 의존성 없이 HAST를 수동 재귀하여 <img> 엘리먼트 수집
type HastNode = { type?: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[] };

function collectImgs(node: HastNode, out: HastNode[]): void {
  if (node.type === "element" && node.tagName === "img") out.push(node);
  if (Array.isArray(node.children)) for (const c of node.children) collectImgs(c, out);
}

const defaultResolve = (src: string): string | undefined => {
  const clean = src.split(/[?#]/)[0];        // 쿼리/해시 suffix 제거
  return assets.get(basename(clean));         // 해시파일명 → 원본 절대경로
};

export default function rehypeImageDimensions(options: RehypeImageDimensionsOptions = {}) {
  const resolve = options.resolve ?? defaultResolve;
  return async (tree: HastNode): Promise<void> => {
    const imgs: HastNode[] = [];
    collectImgs(tree, imgs);
    await Promise.all(
      imgs.map(async (node) => {
        const props = node.properties ?? {};
        const src = props.src;
        if (typeof src !== "string") return;
        if (props.width != null || props.height != null) return; // 이미 치수 있음
        if (/^https?:\/\//.test(src)) return;                     // 원격 URL
        const path = resolve(src);
        if (!path) return;
        try {
          const { width, height } = await sharp(path).metadata();
          if (width && height) {
            props.width = width;
            props.height = height;
            node.properties = props;
          }
        } catch {
          // 읽기 실패 → 치수 없이 통과(PostImage가 native img로 폴백)
        }
      }),
    );
  };
}
