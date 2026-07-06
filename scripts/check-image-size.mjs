import { stat } from "node:fs/promises";
import { walkImages, collectOversized, GATE_EXT } from "./lib/images.mjs";

const CONTENT = new URL("../content/", import.meta.url).pathname;
const LIMIT = 512 * 1024; // 500KB

const files = await walkImages(CONTENT, GATE_EXT);
const entries = await Promise.all(
  files.map(async (path) => ({ path, size: (await stat(path)).size })),
);
const oversized = collectOversized(entries, LIMIT);

if (oversized.length > 0) {
  console.error(`\n❌ ${oversized.length}개 이미지가 ${LIMIT / 1024}KB를 초과합니다:`);
  for (const { path, size } of oversized) {
    console.error(`   ${(size / 1024).toFixed(0)}KB  ${path.replace(CONTENT, "content/")}`);
  }
  console.error(`\n→ pnpm img:optimize 로 원본을 최적화한 뒤 다시 빌드하세요.\n`);
  process.exit(1);
}
console.log("✓ 이미지 용량 게이트 통과");
