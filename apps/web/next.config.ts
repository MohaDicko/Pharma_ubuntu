import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react", "recharts"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
