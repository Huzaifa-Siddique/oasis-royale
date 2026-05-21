import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;
