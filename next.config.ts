import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimisée pour Vercel + Node.js + Supabase
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/downloads/:path*.apk",
        headers: [{ key: "Content-Type", value: "application/vnd.android.package-archive" }],
      },
    ];
  },
};

export default nextConfig;
