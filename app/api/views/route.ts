import { recordView } from "@/shared/views";
import { getPostBySlug } from "@/entities/post";
import { isBotOrPrefetch } from "@/shared/views/lib/detect";
import { hashIp } from "@/shared/views/lib/keys";

// POST는 기본 비캐시 (Next 16 route handler). 집계 전용.
export async function POST(request: Request): Promise<Response> {
  try {
    if (isBotOrPrefetch(request.headers)) return new Response(null, { status: 204 });
    const { slug } = (await request.json()) as { slug?: string };
    // 실제 발행글 slug만 집계 — 가짜 slug 스팸으로 인한 Redis 키 오염 차단.
    // getPostBySlug는 draft/미존재 slug에 null 반환(entities/post).
    if (typeof slug === "string" && slug.length > 0 && getPostBySlug(slug)) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
      await recordView({ slug, ipHash: hashIp(ip) });
    }
  } catch {
    // 어떤 실패도 삼킴 — 집계는 fire-and-forget
  }
  return new Response(null, { status: 204 });
}
