import { getRedis } from "./client";

const VIEWS_KEY = "views";

/**
 * ms 초과 시 fallback으로 resolve (읽기 1.5s / pages-plan §5.3).
 * p가 레이스에서 지고 나중에 reject되어도 unhandled rejection이 새지 않도록
 * p.catch(() => fallback)로 항상 핸들러를 붙인다. 타이머도 정착 시 정리한다.
 */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([p.catch(() => fallback), timeout]).finally(() => clearTimeout(timer));
}

export async function readTopSlugs(n: number): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return []; // env 미설정 → 호출 안 함
  try {
    const op = redis.zrange<string[]>(VIEWS_KEY, 0, n - 1, { rev: true });
    return await withTimeout(op, 1500, []);
  } catch {
    return []; // 절대 규칙: 렌더를 못 깨뜨림
  }
}

export async function readScore(slug: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const op = redis.zscore(VIEWS_KEY, slug) as Promise<number | null>;
    return await withTimeout(op, 1500, null);
  } catch {
    return null;
  }
}
