import { EmptyState } from "@/shared/ui";

// 전역 404 (pages-plan §7.2)
export default function NotFound() {
  return (
    <div className="wrap">
      <EmptyState
        eyebrow="404"
        message="이 길에는 잎이 없습니다."
        sub="없는 페이지예요."
        action={{ href: "/", label: "dongCoding으로 돌아가기 →" }}
      />
    </div>
  );
}
