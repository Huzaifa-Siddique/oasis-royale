import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  transpilePackages: ["framer-motion"],
  experimental: {
    preloadEntriesOnStart: false,
  },
  async headers() {
    return [
      {
        source: "/models/:path*.glb",
        headers: [{ key: "Content-Type", value: "model/gltf-binary" }],
      },
      {
        source: "/models/:path*.usdz",
        headers: [{ key: "Content-Type", value: "model/vnd.usdz+zip" }],
      },
    ];
  },
};

export default nextConfig;

