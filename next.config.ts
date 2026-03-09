import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactCompiler: true,
  experimental: {
    typedEnv: true,
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL ?? "localhost:3000",
  },
};

export default nextConfig;
