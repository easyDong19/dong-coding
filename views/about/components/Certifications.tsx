// 자격증 — 자격증명을 pill 칩 행으로 (design.md §4.10). --line 테두리 + ink, radius pill.
export function Certifications({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="m-0 flex flex-wrap gap-2 p-0">
      {items.map((name) => (
        <li
          key={name}
          className="inline-flex list-none items-center rounded-pill border border-line px-3 py-1 text-sm text-ink"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}
