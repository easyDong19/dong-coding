import { expect, test } from "vitest";
import { isBotOrPrefetch } from "./detect";

const H = (init: Record<string, string>) => new Headers(init);

test("일반 브라우저 UA → false (카운트 허용)", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Mozilla/5.0 (Macintosh) Chrome/120" }))).toBe(false);
});
test("알려진 봇 UA → true", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" }))).toBe(true);
});
test("Sec-Purpose: prefetch → true", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Mozilla/5.0", "sec-purpose": "prefetch;prerender" }))).toBe(true);
});
test("헤더 자체 부재(UA 없음) → false", () => {
  expect(isBotOrPrefetch(H({}))).toBe(false);
});
test("일반 UA에 'preview' substring 포함 → false (오탐 방지)", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Mozilla/5.0 (Macintosh) PreviewPane/2.1 Chrome/120" }))).toBe(false);
});
test("실제 업타임 모니터(UptimeRobot) → true", () => {
  expect(isBotOrPrefetch(H({ "user-agent": "Mozilla/5.0+(compatible; UptimeRobot/2.0)" }))).toBe(true);
});
