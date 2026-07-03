"use client";

import { useEffect, useState } from "react";
import type { FlatHeading } from "../lib/flatten-toc";
import { pickActive, type HeadingPosition } from "../lib/pick-active";

/** 현재 읽는 섹션의 헤딩 id. 헤딩이 없거나 아직 미확정이면 null. */
export function useActiveHeading(headings: FlatHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // 트리거선 = 마스트헤드 높이(--masthead-h rem → px) + 8px 여유.
    // +8은 앵커 착지 지점(scroll-padding-top: --masthead-h)보다 살짝 아래에서
    // active로 전환돼 경계에서 깜빡이지 않게 하는 여유값.
    // 주의: --masthead-h가 고정(3rem)이라고 가정한다.
    const rootStyles = getComputedStyle(document.documentElement);
    const rootFont = parseFloat(rootStyles.fontSize) || 16;
    const mastheadRem = parseFloat(rootStyles.getPropertyValue("--masthead-h")) || 3;
    const triggerLine = mastheadRem * rootFont + 8;

    const compute = () => {
      const positions: HeadingPosition[] = els.map((el) => ({
        id: el.id,
        top: el.getBoundingClientRect().top,
      }));
      setActiveId(pickActive(positions, triggerLine));
    };

    // 관측 밴드를 뷰포트 상단 ~35%로 좁힌다(위 -triggerLine, 아래 -65%).
    // 헤딩이 이 얇은 상단 밴드를 가로지를 때만 콜백 발화 → 스크롤 폴링 없이 active 갱신.
    const observer = new IntersectionObserver(compute, {
      rootMargin: `-${triggerLine}px 0px -65% 0px`,
      threshold: 0,
    });
    els.forEach((el) => observer.observe(el));
    compute(); // 초기 1회(첫 페인트 직후 현재 위치 반영)

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
