import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-082470a50b13e1a72fb29987889950ea.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'cdn.aysubeachlounge.com.br',
      },
    ],
  },
};

export default nextConfig;
