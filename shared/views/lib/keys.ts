import { createHash } from "node:crypto";

/**
 * dev/prod 데이터 격리 네임스페이스 (옵션 2 — 같은 Redis DB를 접두사로 분리).
 * Upstash free 플랜은 DB가 계정당 1개라 dev와 prod가 같은 DB를 공유한다.
 * 접두사를 안 나누면 (1) 조회수가 섞이고 (2) dedup 키가 겹쳐 로컬 조회가 prod 카운트를 막는다.
 * 우선순위: 명시 override(VIEWS_NAMESPACE) > NODE_ENV(production→prod, 그 외→dev).
 */
export const namespace =
  process.env.VIEWS_NAMESPACE ?? (process.env.NODE_ENV === "production" ? "prod" : "dev");

export const viewsKey = `views:${namespace}`;

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function dedupKey(ipHash: string, slug: string): string {
  return `dedup:${namespace}:${ipHash}:${slug}`;
}
