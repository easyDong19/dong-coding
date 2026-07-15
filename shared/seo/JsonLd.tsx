// JSON-LD 구조화 데이터를 <script>로 주입. 검색 리치 결과(작성일·저자 노출)용.
// `<` 이스케이프로 </script> 브레이크아웃(XSS) 차단 후 삽입.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
