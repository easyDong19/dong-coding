import Image from "next/image";
import { Quote } from "./Quote";

// 프로필 히어로 (design.md §4.10) — avatar + Quote(role 풀쿼트).
// 사진 크기는 자유(clamp), radius 14px·panel·line 테두리는 정본 유지.
const avatarClass =
  "h-[clamp(9rem,26vw,12rem)] w-[clamp(9rem,26vw,12rem)] flex-none rounded-[14px] border border-line bg-panel object-cover";

export function ProfileHeader({
  role,
  src,
  alt,
}: {
  role: string;
  src?: string;
  alt?: string;
}) {
  return (
    <header className="mt-2 mb-9 flex flex-wrap items-center gap-[clamp(1.5rem,5vw,2.5rem)]">
      {src ? (
        <Image
          className={avatarClass}
          src={src}
          alt={alt ?? role}
          width={384}
          height={384}
          priority
        />
      ) : (
        <div className={avatarClass} aria-hidden="true" />
      )}
      <div className="min-w-0 flex-[1_1_14rem]">
        <Quote>{role}</Quote>
      </div>
    </header>
  );
}
