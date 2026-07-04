import { Redis } from "@upstash/redis";

/** env 둘 다 있을 때만 클라이언트 생성. 없으면 null → 호출부는 즉시 폴백. (pages-plan §5.3) */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
