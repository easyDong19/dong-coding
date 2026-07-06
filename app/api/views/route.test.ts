import { expect, test, vi, beforeEach } from "vitest";

const recordView = vi.fn();
const getPostBySlug = vi.fn();

vi.mock("@/shared/views", () => ({ recordView: (...a: unknown[]) => recordView(...a) }));
vi.mock("@/entities/post", () => ({ getPostBySlug: (s: string) => getPostBySlug(s) }));
vi.mock("@/shared/views/lib/detect", () => ({ isBotOrPrefetch: () => false }));
vi.mock("@/shared/views/lib/keys", () => ({ hashIp: (ip: string) => `h:${ip}` }));

beforeEach(() => {
  recordView.mockReset();
  getPostBySlug.mockReset();
});

function req(body: unknown): Request {
  return new Request("http://x/api/views", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
}

test("실제 발행글 slug → recordView 호출", async () => {
  getPostBySlug.mockReturnValue({ slug: "real" });
  const { POST } = await import("./route");
  const res = await POST(req({ slug: "real" }));
  expect(res.status).toBe(204);
  expect(recordView).toHaveBeenCalledWith({ slug: "real", ipHash: "h:1.2.3.4" });
});

test("존재하지 않는/draft slug → recordView 미호출 (키 오염 차단)", async () => {
  getPostBySlug.mockReturnValue(null);
  const { POST } = await import("./route");
  const res = await POST(req({ slug: "gksdlrjs-fake-9999" }));
  expect(res.status).toBe(204);
  expect(recordView).not.toHaveBeenCalled();
});

test("빈 slug → recordView 미호출 (검증 자체 통과 안 함)", async () => {
  getPostBySlug.mockReturnValue({ slug: "" });
  const { POST } = await import("./route");
  const res = await POST(req({ slug: "" }));
  expect(res.status).toBe(204);
  expect(recordView).not.toHaveBeenCalled();
});
