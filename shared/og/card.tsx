import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/shared/config";
import { loadOgFonts } from "./font";
import { clampTitle } from "./text";

// OG 표준 규격(1.91:1). opengraph-image 라우트가 size export로 재사용한다.
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

// design.md §2.1 — 5색 토큰의 라이트값만. OG는 정적 PNG라 다크 대응 불가 → 라이트 고정.
const COLOR = {
  paper: "#F4F5EE",
  ink: "#232A22",
  moss: "#4F6442",
  stone: "#6B7163",
} as const;

// design.md §3 — 줄기-잎 모티프(shared/ui/LeafSymbols의 path 재사용).
function Leaf({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
      <path
        d="M12 2C7 6 4 10 4 15a8 8 0 0 0 16 0c0-5-3-9-8-13Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
      />
      <path d="M12 5v14" fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}

/**
 * 브랜드 카드를 PNG로 굽는다.
 * - title 있음(글 상세 폴백): 히어로=제목, 하단=태그라인.
 * - title 없음(사이트 기본): 히어로=태그라인(크게), 하단 없음.
 */
export async function renderBrandCard(title?: string): Promise<ImageResponse> {
  const fonts = await loadOgFonts();
  const hero = title ? clampTitle(title) : SITE_DESCRIPTION;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "76px 84px",
          background: COLOR.paper,
          fontFamily: "Pretendard",
          position: "relative",
        }}
      >
        {/* 상단 액센트 바 — 줄기 모티프 연장 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 12,
            background: COLOR.moss,
          }}
        />
        {/* 우하단 잎 워터마크 */}
        <div style={{ position: "absolute", right: -36, bottom: -72, display: "flex" }}>
          <Leaf size={380} color={COLOR.moss} opacity={0.08} />
        </div>

        {/* 브랜드 */}
        <div style={{ display: "flex", alignItems: "center", color: COLOR.moss }}>
          <Leaf size={46} color={COLOR.moss} />
          <span style={{ fontSize: 34, fontWeight: 700, marginLeft: 14 }}>{SITE_NAME}</span>
        </div>

        {/* 히어로 — 제목(글 상세) 또는 태그라인(기본) */}
        <div
          style={{
            display: "flex",
            color: COLOR.ink,
            fontSize: title ? 66 : 82,
            fontWeight: 700,
            lineHeight: 1.28,
            wordBreak: "keep-all",
            maxWidth: 940,
          }}
        >
          {hero}
        </div>

        {/* 하단 태그라인 — 제목이 있을 때만(중복 방지) */}
        <div style={{ display: "flex", color: COLOR.stone, fontSize: 30, fontWeight: 400 }}>
          {title ? SITE_DESCRIPTION : ""}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

// 커버 확장자 → MIME. satori <img>는 data URI를 정확한 MIME으로 받아야 디코드된다.
const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

/**
 * 글 cover를 1200×630에 objectFit:cover로 정규화한 카드(§6.6 "cover 우선").
 * coverSrc는 velite s.image()의 public 경로(예: /static/xxx.png) → 빌드타임에 파일을 읽어 data URI로.
 */
export async function renderCoverCard(coverSrc: string): Promise<ImageResponse> {
  const dot = coverSrc.lastIndexOf(".");
  const ext = dot >= 0 ? coverSrc.slice(dot).toLowerCase() : "";
  const bytes = await readFile(join(process.cwd(), "public", coverSrc));
  const dataUrl = `data:${MIME[ext] ?? "image/png"};base64,${bytes.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* satori(next/og) 전용 렌더 — next/image 불가, <img> 필수 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt=""
        />
      </div>
    ),
    { ...OG_SIZE },
  );
}
