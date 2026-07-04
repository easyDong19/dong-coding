"use client";
import { useEffect, useRef } from "react";

export function ViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return; // StrictMode 이중 마운트 가드
    sent.current = true;
    fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {}); // 실패 삼킴 (UI 영향 0)
  }, [slug]);
  return null;
}
