export type HeadingPosition = { id: string; top: number };

/**
 * 트리거선 위로 지나간(top <= triggerLine) 마지막 헤딩 id.
 * 아무도 안 지나갔으면 첫 헤딩(최상단), 목록이 비면 null.
 * positions 는 문서 순서라고 가정.
 */
export function pickActive(
  positions: HeadingPosition[],
  triggerLine: number,
): string | null {
  if (positions.length === 0) return null;
  let active = positions[0].id;
  for (const pos of positions) {
    if (pos.top <= triggerLine) active = pos.id;
  }
  return active;
}
