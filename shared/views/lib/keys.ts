import { createHash } from "node:crypto";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function dedupKey(ipHash: string, slug: string): string {
  return `dedup:${ipHash}:${slug}`;
}
