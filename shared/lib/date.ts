// ISO 날짜를 YYYY.MM.DD로 — 문자열 슬라이스라 타임존 영향 없이 결정적(SSG 안정).
export function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}
