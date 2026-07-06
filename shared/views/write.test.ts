import { expect, test, vi, beforeEach } from "vitest";
import { viewsKey } from "./lib/keys";

const getRedis = vi.fn();
vi.mock("./client", () => ({ getRedis: () => getRedis() }));
beforeEach(() => getRedis.mockReset());

test("env 미설정 → no-op (throw 없음)", async () => {
  getRedis.mockReturnValue(null);
  const { recordView } = await import("./write");
  await expect(recordView({ slug: "a", ipHash: "h" })).resolves.toBeUndefined();
});
test("§4.2-4: 쓰기 실패 → 조용히 무시(swallow)", async () => {
  getRedis.mockReturnValue({ set: () => { throw new Error("boom"); } });
  const { recordView } = await import("./write");
  await expect(recordView({ slug: "a", ipHash: "h" })).resolves.toBeUndefined();
});
test("dedup 미존재 시(SET 성공) ZINCRBY 호출", async () => {
  const zincrby = vi.fn(async () => 1);
  getRedis.mockReturnValue({ set: async () => "OK", zincrby });
  const { recordView } = await import("./write");
  await recordView({ slug: "a", ipHash: "h" });
  expect(zincrby).toHaveBeenCalledWith(viewsKey, 1, "a");
});
test("dedup 존재 시(SET null) ZINCRBY 호출 안 함", async () => {
  const zincrby = vi.fn(async () => 1);
  getRedis.mockReturnValue({ set: async () => null, zincrby });
  const { recordView } = await import("./write");
  await recordView({ slug: "a", ipHash: "h" });
  expect(zincrby).not.toHaveBeenCalled();
});
