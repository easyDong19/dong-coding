import { recordView } from "@/shared/views";
import { isBotOrPrefetch } from "@/shared/views/lib/detect";
import { hashIp } from "@/shared/views/lib/keys";

// POST는 기본 비캐시 (Next 16 route handler). 집계 전용.
export async function POST(request: Request): Promise<Response> {
  try {
    if (isBotOrPrefetch(request.headers)) return new Response(null, { status: 204 });
    const { slug } = (await request.json()) as { slug?: string };
    if (typeof slug === "string" && slug.length > 0) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
      await recordView({ slug, ipHash: hashIp(ip) });
    }
  } catch {
    // 어떤 실패도 삼킴 — 집계는 fire-and-forget
  }
  return new Response(null, { status: 204 });
}
