// 잎 모티프 SVG 심볼 — 문서에 1회만 마운트하고 <use href="#leaf">로 재사용 (design.md §3).
// 장식 요소이므로 aria-hidden.
export function LeafSymbols() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="leaf" viewBox="0 0 24 24">
        <path
          d="M12 2C7 6 4 10 4 15a8 8 0 0 0 16 0c0-5-3-9-8-13Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <path d="M12 5v14" fill="none" stroke="currentColor" strokeWidth={1.2} />
      </symbol>
      <symbol id="leaf-fill" viewBox="0 0 24 24">
        <path d="M12 2C7 6 4 10 4 15a8 8 0 0 0 16 0c0-5-3-9-8-13Z" fill="currentColor" />
      </symbol>
    </svg>
  );
}
