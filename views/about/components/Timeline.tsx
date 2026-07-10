type Link = { label: string; href: string };
type Detail = { when?: string; what: string };
type Item = { when: string; what: string; note?: string; links?: Link[]; details?: Detail[] };

// 칩 내부 GitHub 마크 — SocialLinks와 같은 line 아이콘 톤(currentColor·stroke).
const githubMark = (
  <svg
    className="h-3.5 w-3.5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export function Timeline({ items }: { items: Item[] }) {
  return (
    <ul className="relative m-0 list-none py-0 pr-0 pl-[1.4rem] before:absolute before:left-[0.28rem] before:top-[0.4rem] before:bottom-[0.4rem] before:w-px before:bg-line before:content-['']">
      {items.map((it) => (
        <li
          key={`${it.when}-${it.what}`}
          className="relative py-[0.5rem] before:absolute before:left-[-1.18rem] before:top-[0.95rem] before:h-2 before:w-2 before:rounded-[50%_0_50%_50%] before:rotate-45 before:bg-moss before:content-['']"
        >
          <span className="mr-[0.6rem] text-sm tabular-nums text-stone">{it.when}</span>
          {it.what}
          {/* note — 본문보다 한 단계 낮은 위계. 학점 등 부가 정보 (design.md §4.10) */}
          {it.note && (
            <span className="mt-0.5 block text-sm tabular-nums text-stone">
              {it.note}
            </span>
          )}
          {/* links — 관련 문서 칩. Certifications와 같은 pill, 링크라 hover→moss */}
          {it.links && it.links.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-2">
              {it.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 text-sm text-stone transition-colors hover:border-moss hover:text-moss"
                >
                  {githubMark}
                  {link.label}
                </a>
              ))}
            </span>
          )}
          {/* details — 회사에서 갈라지는 세부 이력. 얕은 sub-줄기 + 작은 잎(moss-soft)으로 위계 표현 */}
          {it.details && it.details.length > 0 && (
            <ul className="relative mt-2 mb-0 ml-[0.1rem] list-none py-0 pl-[1.1rem] before:absolute before:left-[0.18rem] before:top-[0.5rem] before:bottom-[0.55rem] before:w-px before:bg-line before:content-['']">
              {it.details.map((d) => (
                <li
                  key={`${d.when ?? ''}-${d.what}`}
                  className="relative py-[0.3rem] text-sm text-stone before:absolute before:left-[-0.92rem] before:top-[0.72rem] before:h-[0.4rem] before:w-[0.4rem] before:rounded-[50%_0_50%_50%] before:rotate-45 before:bg-moss before:content-['']"
                >
                  {d.when && <span className="mr-[0.5rem] tabular-nums text-stone">{d.when}</span>}
                  {d.what}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
