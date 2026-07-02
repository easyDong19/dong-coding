type PostRef = { slug: string; series?: string; order?: number; draft?: boolean };
type SeriesRef = { slug: string };

export function validateSeriesIntegrity(input: {
  posts: PostRef[];
  series: SeriesRef[];
}): void {
  // draft는 검증 제외 (test-plan §1.4 / 확정 2026-07-02)
  const posts = input.posts.filter((p) => !p.draft);
  const known = new Set(input.series.map((s) => s.slug));

  // (a) 참조 무결성
  for (const p of posts) {
    if (p.series && !known.has(p.series)) {
      throw new Error(`포스트 "${p.slug}"가 없는 시리즈 "${p.series}" 참조`);
    }
  }

  // (b) order 중복 금지
  for (const s of input.series) {
    const orders = posts
      .filter((p) => p.series === s.slug)
      .map((p) => p.order);
    if (new Set(orders).size !== orders.length) {
      throw new Error(`시리즈 "${s.slug}"에 중복 order: ${orders.join(",")}`);
    }
  }

  // (c) 연속성 빈틈은 경고만 — throw 안 함 (정책상 no-op)
}
