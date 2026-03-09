import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactCompiler: true,
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
