// schema.org BlogPosting 객체 생성. JsonLd로 렌더해 글 상세에 주입한다.
export function buildArticleJsonLd(input: {
  url: string; // 절대 URL
  title: string;
  description?: string;
  datePublished: string; // ISO date
  dateModified?: string;
  authorName: string;
  siteName: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: "ko-KR",
    author: { "@type": "Person", name: input.authorName },
    publisher: { "@type": "Organization", name: input.siteName },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
}
