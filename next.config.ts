import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
  // Turso works with Node.js runtime — disable edge for pages that use it
  experimental: {},
};

export default nextConfig;
