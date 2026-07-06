import { Redis } from "@upstash/redis";

/**
 * env 둘 다 있을 때만 클라이언트 생성. 없으면 null → 호출부는 즉시 폴백. (pages-plan §5.3)
 * 이름 두 벌 지원: Upstash 콘솔 직접(`UPSTASH_REDIS_REST_*`) + Vercel 마켓플레이스 통합(`KV_REST_API_*`).
 */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
