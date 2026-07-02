// 우선순위: 저장된 선택 > OS 설정 > system(브라우저 light dark 위임) (design.md §2.1)
export function resolveTheme(
  saved: string | null,
  os: "light" | "dark" | null,
): "light" | "dark" | "system" {
  if (saved === "light" || saved === "dark") return saved;
  if (os === "light" || os === "dark") return os;
  return "system";
}
