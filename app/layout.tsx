import type { Metadata } from "next";
import { pretendard, jetbrains } from "./fonts";
import { LeafSymbols } from "@/shared/ui";
import { themeInitScript } from "@/shared/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "dongCoding",
  description: "코드와 식물 사이, 천천히 자라는 기록",
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <LeafSymbols />
        {children}
      </body>
    </html>
  );
}
