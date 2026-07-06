import { afterEach, expect, test, vi } from "vitest";
import { getSiteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

test("env 있으면 그대로 반환", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dongcoding.dev");
  expect(getSiteUrl()).toBe("https://dongcoding.dev");
});
test("끝 슬래시 제거 (경로 결합 안전)", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dongcoding.dev/");
  expect(getSiteUrl()).toBe("https://dongcoding.dev");
});
test("§5.1-4: env 빈값 → throw (fail-fast)", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  expect(() => getSiteUrl()).toThrow();
});
