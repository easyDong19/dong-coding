type Link = { label: string; href: string };
type Project = { title: string; description: string; links?: Link[] };

// line 아이콘 톤(currentColor·stroke)은 SocialLinks와 일치. href로 마크 선택.
const githubPath = (
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
);
const globePath = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18" />
  </>
);

function LinkChip({ label, href }: Link) {
  const external = href.startsWith("http");
  const isGithub = href.includes("github.com");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 text-sm text-stone transition-colors hover:border-moss hover:text-moss"
    >
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
        {isGithub ? githubPath : globePath}
      </svg>
      {label}
    </a>
  );
}

// 프로젝트 그리드 — 카드는 컨테이너, 링크는 하단 칩(anchor 중첩 방지)
export function Projects({ items }: { items: Project[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
      {items.map((p) => (
        <div
          key={p.title}
          className="flex flex-col rounded-pre border border-line p-4"
        >
          <h3 className="mx-0 mt-0 mb-[0.3rem] text-base font-semibold">{p.title}</h3>
          <p className="m-0 text-sm text-stone">{p.description}</p>
          {p.links && p.links.length > 0 && (
            // mt-auto — 설명 길이가 달라도 칩 줄을 카드 바닥에 정렬
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              {p.links.map((link) => (
                <LinkChip key={link.href} {...link} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
