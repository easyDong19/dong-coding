// About 페이지 콘텐츠 — 구조화 데이터(TS). 글이 아닌 페이지 데이터라 MDX가 아닌 타입 소스로 관리.
// (설계: dong-docs/specs/2026-07-03-about-tsx-migration-design.md, 규약: pages-plan §4)
export interface AboutData {
  profile: { role: string; src: string; alt: string };
  intro: string[];
  // 기술 스택 — 자격증과 같은 pill 행으로 렌더.
  skills: string[];
  // 연락처 — About 콘텐츠의 아이콘 링크 행(design.md §4.10). 값이 있는 항목만 렌더.
  contact: { github?: string; rss?: string; email?: string };
  // note — what 아래 한 단계 낮은 위계로 렌더되는 부가 정보(학점 등). 값 있을 때만 표시.
  // links — 관련 문서 칩(GitHub 등). 값 있을 때만 표시.
  education: {
    when: string;
    what: string;
    note?: string;
    links?: { label: string; href: string }[];
  }[];
  // details — 회사 아래 갈라지는 세부 이력(줄기-잎 가지, design.md 모티프). 값 있을 때만 표시.
  timeline: {
    when: string;
    what: string;
    note?: string;
    links?: { label: string; href: string }[];
    details?: { when?: string; what: string }[];
  }[];
  certifications: string[];
  // links — 카드 하단 링크 칩(GitHub·사이트 등). href로 아이콘 자동 선택.
  projects: {
    title: string;
    description: string;
    links?: { label: string; href: string }[];
  }[];
}

export const aboutData: AboutData = {
  profile: {
    role: '코드는 쉽지, 말을 보여줘',
    src: '/profile.jpg',
    alt: '유동연 프로필 사진',
  },
  intro: [
    '개발자 유동연입니다.',
    '좋은 개발은 단순히 코드를 잘 작성하는 것을 넘어,',
    '시간과 비용, 팀의 상황, 유지보수 가능성, 사용자 경험 사이에서 적절한 균형을 찾는 일이라고 생각합니다.',
  ],
  skills: ['JavaScript', 'TypeScript', 'React.js', 'Next.js'],
  contact: {
    github: 'https://github.com/easyDong19',
    rss: '/feed.xml',
    email: 'mailto:ymh1353@naver.com',
  },
  education: [
    {
      when: '2019–2024',
      what: '한양대학교 산업공학과 학사',
      note: '학점 3.87 / 4.5',
    },
    { when: '2016–2018', what: '한국디지털미디어고등학교 해킹방어과' },
  ],
  timeline: [
    {
      when: '2024.07 – 현재',
      what: 'SAFEAI',
      links: [
        {
          label: '경력기술서',
          href: 'https://github.com/easyDong19/easyDong19/blob/main/resume.pdf',
        },
      ],
      // 세부 이력은 경력기술서 PDF로 대체 (칩 링크).
    },
    {
      when: '2024.01.02–02.28',
      what: 'FINX LAB 겨울방학 인턴',
      links: [
        {
          label: 'intern_project',
          href: 'https://github.com/easyDong19/intern_project',
        },
        { label: 'portfolio', href: 'https://github.com/easyDong19/portfolio' },
        {
          label: 'capstone_2',
          href: 'https://github.com/easyDong19/capstone_2',
        },
        {
          label: 'Volatility_Forecasting',
          href: 'https://github.com/easyDong19/Volatility_Forecasting',
        },
      ],
    },
  ],
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
      description: '천천히 자라는 기록, 이 블로그',
      links: [
        { label: 'GitHub', href: 'https://github.com/easyDong19/dong-coding' },
        { label: '블로그', href: '/' },
      ],
    },
    {
      title: 'eduForSori',
      description: '기획자 친구와 협업하기 위한 지식 아티팩트 모음',
      links: [
        { label: 'GitHub', href: 'https://github.com/easyDong19/eduForSori' },
        { label: '사이트', href: 'https://easydong19.github.io/eduForSori/' },
      ],
    },
    {
      title: 'one-pointer',
      description: '손코딩 없이 바이브 코딩만으로 만든 전문가 매칭 플랫폼',
      links: [
        { label: 'GitHub', href: 'https://github.com/easyDong19/one-pointer' },
      ],
    },
  ],
};
