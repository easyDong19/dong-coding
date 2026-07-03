// 소개 리드(lede) — ProfileHeader 아래 한두 문장.
// 원본 CSS 캐스케이드 주의: 옛 `.body p` 규칙(margin 1.1rem 0, 잉크색)이
// 옛 `.ledeLine` 규칙(margin 0.7rem 0)보다 명시도가 높아(0,1,1 > 0,1,0) margin은
// 1.1rem 0으로 렌더됨 — 아래 mx-0 my-[1.1rem]로 그대로 재현(0.7rem 아님).
export function Intro({ lines }: { lines: string[] }) {
  return (
    <div className="mx-0 mt-0 mb-10">
      {lines.map((line, i) => (
        <p
          key={i}
          className="mx-0 my-[1.1rem] text-lg leading-[1.7] tracking-[-0.02em] text-ink"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
