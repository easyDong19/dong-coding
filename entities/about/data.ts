// About 페이지 콘텐츠 — 구조화 데이터(TS). 글이 아닌 페이지 데이터라 MDX가 아닌 타입 소스로 관리.
// (설계: dong-docs/specs/2026-07-03-about-tsx-migration-design.md, 규약: pages-plan §4)
export interface AboutData {
  profile: { role: string; src: string; alt: string };
  intro: string[];
  timeline: { when: string; what: string }[];
  projects: { title: string; description: string; href: string }[];
}

export const aboutData: AboutData = {
  profile: {
    role: "코드는 쉽지, 말을 보여줘",
    src: "/profile.jpg",
    alt: "유동연 프로필 사진",
  },
  intro: [
    "안녕하세요 개발자 유동연입니다.",
    "저는 논리, 철학, 금융, 비즈니스, 야구 등 여러 분야에 관심이 많습니다.",
    "일할 때 제약조건을 정하는 것을 가장 중요하게 생각합니다.",
  ],
  timeline: [{ when: "2026", what: "dongCoding 블로그를 심었습니다." }],
  projects: [
    {
      title: "dongCoding",
      description: "천천히 자라는 기록. 이 블로그.",
      href: "https://github.com/easyDong19/dong-coding",
    },
  ],
};
