import type { NextConfig } from "next";

const publicPageCacheHeaders = [
  { key: "Vercel-CDN-Cache-Control", value: "s-maxage=300, stale-while-revalidate=86400" },
];

const shortPublicPageCacheHeaders = [
  { key: "Vercel-CDN-Cache-Control", value: "s-maxage=60, stale-while-revalidate=3600" },
];

const immutableAssetHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-082470a50b13e1a72fb29987889950ea.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.aysubeachlounge.com.br",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/cardapio",
        headers: shortPublicPageCacheHeaders,
      },
      {
        source: "/eventos",
        headers: shortPublicPageCacheHeaders,
      },
      {
        source: "/experiencias",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/galeria-eventos",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/galeria-eventos/:path*",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/midia",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/politicas/:path*",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/manutencao",
        headers: publicPageCacheHeaders,
      },
      {
        source: "/_next/static/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/espacos/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/eventos/:path*",
        headers: immutableAssetHeaders,
      },
      {
        source: "/favicon.png",
        headers: immutableAssetHeaders,
      },
    ];
  },
};

export default nextConfig;
