import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Velite가 빌드타임에 blur+치수를 산출하므로 Vercel 이미지 재최적화 끔 (tech-stack §6.2)
  images: { unoptimized: true },
};

export default nextConfig;
