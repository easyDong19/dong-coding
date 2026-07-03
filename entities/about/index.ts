import { aboutData, type AboutData } from "./data";

// About 콘텐츠 접근은 entities 경유 (경량 FSD). MDX가 아닌 타입 데이터 소스.
export function getAbout(): AboutData {
  return aboutData;
}
export type { AboutData } from "./data";
