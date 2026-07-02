import { about } from "@/.velite";

// About 콘텐츠도 .velite 접근은 entities 경유 (경량 FSD)
export function getAbout() {
  return about;
}
export type { About } from "@/.velite";
