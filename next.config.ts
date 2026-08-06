import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@firecrawl/pdf-inspector'],
  allowedDevOrigins: [
    'localhost',
    '192.168.0.201:3000',
    '192.168.0.201',
    '192.168.0.236',
    '192.168.0.236:3000'
  ],
};

export default nextConfig;
