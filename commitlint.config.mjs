// dongCoding 커밋 메시지 검증 — commit-convention.md §4 정본
// 표준 규칙을 베이스로 깔고, type만 우리 7개로 제한한다.
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 우리가 정한 7개 타입만 허용 (표준 + 블로그 전용 'post')
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'post', 'docs', 'style', 'refactor', 'chore'],
    ],
    'type-case': [2, 'always', 'lower-case'], // 타입은 소문자
    'type-empty': [2, 'never'], // 타입 필수
    'subject-empty': [2, 'never'], // 제목 필수
    'subject-full-stop': [2, 'never', '.'], // 제목 끝 마침표 금지
    // 한국어 제목에 CI·PR·RSS·OG·MDX 등 영어 약어가 앞에 오는 걸 허용 (영어용 case 규칙 해제).
    // CI의 PR 제목 검사(action-semantic-pull-request)도 case를 강제하지 않아 게이트 일치.
    'subject-case': [0],
    'header-max-length': [2, 'always', 72], // 헤더 72자 이내
    // 스코프 안 씀 → config-conventional 기본값이 스코프를 강제하지 않으므로 별도 규칙 불필요
  },
}

export default config
