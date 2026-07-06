"use client";

import Image from "next/image";
import { resolveImageProps } from "./post-image-props";

const CLASS = "mx-0 my-6 block w-full rounded-pre border border-line";

export function PostImage(props: Record<string, unknown>) {
  const resolved = resolveImageProps(props);
  if (!resolved) return null;
  if (resolved.kind === "next") {
    return (
      <Image
        className={CLASS}
        src={resolved.src}
        alt={resolved.alt}
        width={resolved.width}
        height={resolved.height}
        sizes="(max-width: 768px) 100vw, 700px"
        style={{ width: "100%", height: "auto" }}
      />
    );
  }
  // 원격/치수 미확보 → 네이티브 img 폴백
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={CLASS} src={resolved.src} alt={resolved.alt} />;
}
