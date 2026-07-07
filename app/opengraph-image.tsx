import { renderBrandCard, OG_SIZE, OG_CONTENT_TYPE } from "@/shared/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/shared/config";

// 사이트 기본 OG — 홈·시리즈·About 등 글 상세를 제외한 모든 라우트가 상속(폴더 계층).
export const alt = `${SITE_NAME} — ${SITE_DESCRIPTION}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderBrandCard();
}
