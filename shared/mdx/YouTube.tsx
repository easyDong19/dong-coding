"use client";

import { useState } from "react";

/**
 * YouTube 파사드 임베드. 로드 시엔 썸네일 1장만, 클릭(재생 의사) 시에만
 * iframe을 주입해 YouTube 스크립트를 지연 로드한다. 색은 디자인 토큰만 사용.
 */
export function YouTube(props: Record<string, unknown>) {
  const id = typeof props.id === "string" ? props.id : undefined;
  const title = typeof props.title === "string" ? props.title : "YouTube 영상";
  const [playing, setPlaying] = useState(false);

  if (!id) return null;

  const box = "relative my-6 aspect-video w-full overflow-hidden rounded-pre border border-line";

  if (playing) {
    return (
      <div className={box}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={`${box} group block cursor-pointer bg-panel`}
      aria-label={`재생: ${title}`}
    >
      {/* 썸네일 — maxres가 없는 영상은 hqdefault로 폴백 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        }}
      />
      {/* 재생 버튼 — moss 원 + paper 삼각형 */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-moss transition-transform group-hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-[1px] fill-paper" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
