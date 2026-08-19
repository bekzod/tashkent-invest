import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: { root: __dirname },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }] },
};

export default nextConfig;
