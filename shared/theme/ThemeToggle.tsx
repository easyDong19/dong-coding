"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "dc-theme";
const THEME_EVENT = "dc-theme-change";

// 외부 가변 상태(<html data-theme> · OS 선호)를 구독한다. 자체 토글도 THEME_EVENT로 통지.
function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

// 저장된 선택(data-theme) 우선 > OS (design.md §2.1).
function getSnapshot(): boolean {
  const saved = document.documentElement.getAttribute("data-theme");
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// 서버는 저장값·OS를 모른다 — light로 가정하고 클라이언트에서 정정(무플래시는 head 스크립트가 담당).
function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) — 세션 한정으로 동작
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center justify-center rounded-pill border-0 bg-transparent p-1 text-stone transition-colors hover:text-ink"
      aria-pressed={dark}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={toggle}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// 초승달 = "다크로 전환" 어포던스, 해 = "라이트로 전환" (design.md 5색, currentColor 상속).
function MoonIcon() {
  return (
    <svg
      className="h-[1.2rem] w-[1.2rem]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="h-[1.2rem] w-[1.2rem]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
