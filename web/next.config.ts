import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — deployable to Cloudflare Pages (or any static host).
  output: "export",
};

export default nextConfig;
