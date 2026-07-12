import type { Metadata } from "next";
import { pretendard, jetbrains } from "./fonts";
import { LeafSymbols } from "@/shared/ui";
import { ThemeInitScript } from "@/shared/theme";
import { Masthead } from "@/widgets/masthead";
import { Footer } from "@/widgets/footer";
import { SITE_NAME, SITE_DESCRIPTION, getSiteUrl } from "@/shared/config";
import "./globals.css";

export const metadata: Metadata = {
  // 모든 og/twitter 이미지·URL이 절대 URL로 자동 해결됨(dev: .env.local, prod: env 필수).
  metadataBase: new URL(getSiteUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: {
    types: { "application/rss+xml": "/feed.xml" }, // RSS 리더 auto-discovery
  },
  // og:image는 opengraph-image 파일 컨벤션이 자동 주입. 여기선 텍스트 필드만(사이트 기본값,
  // 글 상세는 generateMetadata에서 override). 자동 추론에 의존하지 않고 명시적으로 세팅.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* 렌더 전 테마 반영 — CSS보다 먼저 실행돼야 하므로 <head> 최상단 (design.md §2.1) */}
        <ThemeInitScript />
      </head>
      <body>
        <LeafSymbols />
        <Masthead />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
