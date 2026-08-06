import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@firecrawl/pdf-inspector'],
  experimental: {
    allowedDevOrigins: [
      'localhost',
      '192.168.0.201:3000',
      '192.168.0.201'
    ],
  },
};

export default nextConfig;
