import { expect, test } from "vitest";
import { hashIp, dedupKey } from "./keys";

test("dedupKey 형식 고정 — dedup:{ipHash}:{slug}", () => {
  expect(dedupKey("abc123", "hello")).toBe("dedup:abc123:hello");
});
test("hashIp: 같은 IP → 같은 해시(결정적)", () => {
  expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
});
test("hashIp: 다른 IP → 다른 해시", () => {
  expect(hashIp("1.2.3.4")).not.toBe(hashIp("5.6.7.8"));
});
test("hashIp: 원문 IP가 출력에 포함되지 않음 (프라이버시)", () => {
  expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
});
