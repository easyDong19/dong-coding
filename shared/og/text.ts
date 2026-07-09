/**
 * OG 카드 히어로 제목 길이 가드.
 * satori는 고정 1200×630 캔버스를 래스터화만 하므로(오버플로 에러 없음), 66px·maxWidth 940에서
 * 약 3줄(≈42자)을 넘는 제목이 하단 태그라인을 침범/오버플로하는 것을 코드에서 막는다.
 * keep-all이라 단어 중간 줄바꿈이 없어 긴 제목일수록 위험 → 초과 시 말줄임.
 */
export function clampTitle(title: string, max = 42): string {
  const t = title.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
