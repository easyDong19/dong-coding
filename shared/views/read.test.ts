import { expect, test, vi, beforeEach } from "vitest";

const getRedis = vi.fn();
vi.mock("./client", () => ({ getRedis: () => getRedis() }));

beforeEach(() => getRedis.mockReset());

test("§4.2-1: env 미설정(getRedis=null) → 즉시 [] (Redis 호출 안 함)", async () => {
  getRedis.mockReturnValue(null);
  const { readTopSlugs } = await import("./read");
  expect(await readTopSlugs(5)).toEqual([]);
});
test("§4.2-3: Redis 예외 → [] (throw 전파 없음)", async () => {
  getRedis.mockReturnValue({
    zrange: () => {
      throw new Error("boom");
    },
  });
  const { readTopSlugs } = await import("./read");
  await expect(readTopSlugs(5)).resolves.toEqual([]);
});
test("정상: zrange 결과 그대로 반환", async () => {
  getRedis.mockReturnValue({ zrange: async () => ["a", "b"] });
  const { readTopSlugs } = await import("./read");
  expect(await readTopSlugs(5)).toEqual(["a", "b"]);
});
test("§4.2-5: ZSCORE 실패 → null (뷰에서 숫자 숨김)", async () => {
  getRedis.mockReturnValue({
    zscore: () => {
      throw new Error("x");
    },
  });
  const { readScore } = await import("./read");
  expect(await readScore("a")).toBeNull();
});

test("withTimeout: 타임아웃 후 늦게 reject되는 op → 폴백 반환(throw/누출 없음)", async () => {
  vi.useFakeTimers();
  try {
    const { withTimeout } = await import("./read");
    const slow = new Promise<string>((_, reject) => setTimeout(() => reject(new Error("late")), 5000));
    const raced = withTimeout(slow, 1500, "FALLBACK");
    await vi.advanceTimersByTimeAsync(1500);
    await expect(raced).resolves.toBe("FALLBACK");
    await vi.advanceTimersByTimeAsync(5000); // drive the late rejection; must be swallowed
  } finally {
    vi.useRealTimers();
  }
});
