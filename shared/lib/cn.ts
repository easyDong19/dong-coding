import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 유틸리티 클래스 병합 — 조건부 조합(clsx) 후 충돌 해소(tailwind-merge).
// 외부 className이 내부 기본값을 이기도록: cn("text-stone", className).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
