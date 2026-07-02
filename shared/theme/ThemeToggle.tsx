"use client";

import { useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

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
      className={styles.toggle}
      aria-pressed={dark}
      aria-label="다크 모드 전환"
      onClick={toggle}
    >
      <span aria-hidden="true">{dark ? "●" : "◐"}</span>
      <span>{dark ? "라이트" : "다크"}</span>
    </button>
  );
}
