import { readFile } from "node:fs/promises";
import { join } from "node:path";

// satori는 woff2를 파싱하지 못한다(ttf/otf/woff만). 셀프호스트 PretendardVariable.woff2를
// 라틴+한글 음절 전체로 subset한 static ttf(400·700)로 변환해 여기에 둔다(빌드타임 전용,
// 클라이언트 번들과 무관). 재생성: scripts/build-og-fonts.py (design.md §2.2 — Pretendard 한 종).
const FONT_DIR = join(process.cwd(), "shared/og/fonts");

export type OgFont = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: "normal";
};

// 모듈 스코프 메모이즈 — 빌드 시 카드 N장을 굽는 동안 같은 ttf를 반복 readFile 하지 않는다
// (vercel-react-best-practices: server-hoist-static-io).
let cache: Promise<OgFont[]> | null = null;

export function loadOgFonts(): Promise<OgFont[]> {
  cache ??= Promise.all([
    readFile(join(FONT_DIR, "Pretendard-400.ttf")),
    readFile(join(FONT_DIR, "Pretendard-700.ttf")),
  ]).then(([regular, bold]): OgFont[] => [
    { name: "Pretendard", data: regular, weight: 400, style: "normal" },
    { name: "Pretendard", data: bold, weight: 700, style: "normal" },
  ]);
  return cache;
}
