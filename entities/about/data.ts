// About 페이지 콘텐츠 — 구조화 데이터(TS). 글이 아닌 페이지 데이터라 MDX가 아닌 타입 소스로 관리.
// (설계: dong-docs/specs/2026-07-03-about-tsx-migration-design.md, 규약: pages-plan §4)
export interface AboutData {
  profile: { role: string; src: string; alt: string };
  intro: string[];
  // 연락처 — About 콘텐츠의 아이콘 링크 행(design.md §4.10). 값이 있는 항목만 렌더.
  contact: { github?: string; rss?: string; email?: string };
  education: { when: string; what: string }[];
  timeline: { when: string; what: string }[];
  certifications: string[];
  projects: { title: string; description: string; href: string }[];
}

export const aboutData: AboutData = {
  profile: {
    role: '코드는 쉽지, 말을 보여줘',
    src: '/profile.jpg',
    alt: '유동연 프로필 사진',
  },
  intro: [
    '개발자 유동연입니다.',
    '단편적인 현상보다 그 뒤에 있는 맥락과 목적을 먼저 보려 합니다. 기술을 선택할 때도 유행이나 익숙함보다, 지금 해결해야 하는 문제와 주어진 제약조건을 기준으로 판단하려고 합니다.',
    '좋은 개발은 단순히 코드를 잘 작성하는 것을 넘어, 시간과 비용, 팀의 상황, 유지보수 가능성, 사용자 경험 사이에서 적절한 균형을 찾는 일이라고 생각합니다.',
  ],
  contact: {
    github: 'https://github.com/easyDong19',
    rss: '/feed.xml',
    email: 'mailto:ymh1353@naver.com',
  },
  education: [
    { when: '2016–2018', what: '한국디지털미디어고등학교 해킹방어과' },
    { when: '2019–2024', what: '한양대학교 산업공학과' },
  ],
  timeline: [{ when: '2026', what: 'dongCoding 블로그를 심었습니다.' }],
  certifications: [
    '정보처리기사',
    'SQLD',
    'ADSP',
    '네트워크 관리사 2급',
    '투자자산운용사',
  ],
  projects: [
    {
      title: 'dongCoding',
      description: '천천히 자라는 기록. 이 블로그.',
      href: 'https://github.com/easyDong19/dong-coding',
    },
  ],
};
