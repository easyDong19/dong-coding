import type { ReactNode } from "react";

// 연락처 아이콘 행 — intro 아래에 배치 (design.md §4.10 Contact).
// 잎 장식이 아니라 기능 링크(§1 원칙 3). line-style 아이콘은 잎 아웃라인과 톤을 맞춘다(stroke·currentColor).
type Contact = { github?: string; rss?: string; email?: string };

const ICON: Record<keyof Contact, ReactNode> = {
  github: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  ),
  rss: (
    <>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  email: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
};

const LABEL: Record<keyof Contact, string> = {
  github: "GitHub",
  rss: "RSS",
  email: "메일",
};

const ORDER: (keyof Contact)[] = ["github", "rss", "email"];

export function SocialLinks({ contact }: { contact: Contact }) {
  const items = ORDER.filter((k) => contact[k]);
  if (items.length === 0) return null;

  return (
    <nav aria-label="연락처" className="-ml-2.5 mt-2 mb-11 flex items-center gap-1">
      {items.map((k) => {
        const href = contact[k]!;
        const external = href.startsWith("http");
        return (
          <a
            key={k}
            href={href}
            aria-label={LABEL[k]}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-stone transition-colors hover:bg-moss-soft hover:text-moss"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICON[k]}
            </svg>
          </a>
        );
      })}
    </nav>
  );
}
