import Image from "next/image";

// 프로필 히어로 — 이름 없이 role(tagline)을 h1으로 (about 전환 설계 §2)
const avatarClass = "h-[clamp(7.5rem,16vw,10.5rem)] w-[clamp(7.5rem,16vw,10.5rem)] flex-none rounded-[14px] border border-line bg-panel object-cover";

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
    <header className="mx-0 mt-6 mb-7 flex flex-wrap items-center gap-[clamp(1.25rem,4vw,2rem)]">
      {src ? (
        <Image className={avatarClass} src={src} alt={alt ?? role} width={336} height={336} priority />
      ) : (
        <div className={avatarClass} aria-hidden="true" />
      )}
      <div className="min-w-0 flex-[1_1_16rem]">
        <h1 className="m-0 text-base font-medium tracking-[0.02em] text-stone">{role}</h1>
      </div>
    </header>
  );
}
