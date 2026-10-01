import type { NextConfig } from "next";

function avatarRemotePatterns(): URL[] {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return [];
  try {
    return [new URL("/storage/v1/object/public/avatars/**", value)];
  } catch {
    return [];
  }
}

// The PDF routes read the fonts and seal from public/ with fs, so trace them into those functions.
const pdfAssets = ["./public/fonts/DejaVu*.ttf", "./public/nba-seal.png"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: avatarRemotePatterns(),
  },
  outputFileTracingIncludes: {
    "/certificates/[id]/pdf": pdfAssets,
    "/transactions/[id]/invoice/pdf": pdfAssets,
  },
  async headers() {
    return [
      {
        // The service worker is never cached, so an update reaches users on their next visit.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
