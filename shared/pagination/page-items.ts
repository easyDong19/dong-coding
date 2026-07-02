export function getPageItems(current: number, total: number): Array<number | "…"> {
  // current를 중심으로 폭 3의 연속 블록을 만들되, 앞/끝에서는 밀어 3개를 보장
  let start = current - 1;
  let end = current + 1;
  if (start < 1) {
    end += 1 - start;
    start = 1;
  }
  if (end > total) {
    start -= end - total;
    end = total;
  }
  start = Math.max(1, start);

  const pages = new Set<number>([1, total]);
  for (let n = start; n <= end; n++) pages.add(n);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap === 2) out.push(sorted[i - 1] + 1); // 1페이지 갭 → 숫자로 메움
      else if (gap > 2) out.push("…");
    }
    out.push(sorted[i]);
  }
  return out;
}
