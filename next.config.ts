import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    preloadEntriesOnStart: false,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pizza",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
