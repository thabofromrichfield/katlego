import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,          // Leaflet is incompatible with strict mode double-invoke
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
