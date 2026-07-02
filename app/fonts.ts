import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

// Pretendard Variable 1개로 400·500·600·700 커버 (tech-stack §6.7)
// next/font 변수명은 --font-sans/--mono와 분리 — @theme 토큰이 이를 참조하므로
// 이름이 겹치면 순환 참조가 된다.
export const pretendard = localFont({
  src: "../shared/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "400 700",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
