import type { Metadata } from "next";
import { pretendard, jetbrains } from "./fonts";
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
    <html lang="ko" className={`${pretendard.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
