import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@obsidian-comments/shared"],
};

export default nextConfig;
