const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|uptimerobot|pingdom/i;

export function isBotOrPrefetch(headers: Headers): boolean {
  const purpose = (headers.get("sec-purpose") ?? "") + " " + (headers.get("purpose") ?? "");
  if (purpose.toLowerCase().includes("prefetch")) return true;
  const ua = headers.get("user-agent");
  if (!ua) return false; // 헤더 부재 → 카운트 허용 (test-plan §4.1)
  return BOT_UA.test(ua);
}
