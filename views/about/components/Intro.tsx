// 소개 — 첫 줄은 리드(lede, `--text-lg`), 이후 문단은 본문(`--text-base`)로 위계를 준다.
// line-height·자간은 각 크기 페어링(design.md §2.2): lede 1.7/-.02em, 본문 1.78/-.005em.
export function Intro({ lines }: { lines: string[] }) {
  const [lede, ...rest] = lines;
  return (
    <div className="mx-0 mt-0 mb-6">
      {lede && (
        <p className="mx-0 mt-0 mb-5 text-lg leading-[1.7] tracking-[-0.02em] text-ink">
          {lede}
        </p>
      )}
      {rest.map((line, i) => (
        <p
          key={i}
          className="mx-0 my-[1.1rem] text-base leading-[1.78] tracking-[-0.005em] text-ink"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
