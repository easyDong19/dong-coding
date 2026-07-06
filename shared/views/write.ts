import { getRedis } from "./client";
import { dedupKey } from "./lib/keys";
import { withTimeout } from "./read";

const VIEWS_KEY = "views";

export async function recordView(input: { slug: string; ipHash: string }): Promise<void> {
  const redis = getRedis();
  if (!redis) return; // env 미설정 → no-op
  try {
    // 24h 중복방지: 키가 없을 때만 SET, 성공("OK")이면 최초 조회
    const set = redis.set(dedupKey(input.ipHash, input.slug), 1, { nx: true, ex: 86400 });
    const first = await withTimeout(set, 2000, null);
    if (first === "OK") {
      await withTimeout(redis.zincrby(VIEWS_KEY, 1, input.slug), 2000, 0);
    }
  } catch {
    // swallow — 카운트만 안 오름, UI 영향 0 (pages-plan §5.2)
  }
}
