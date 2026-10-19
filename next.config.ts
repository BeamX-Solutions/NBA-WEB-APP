import type { NextConfig } from "next";

// The PDF routes read the fonts and seal from public/ with fs, so trace them into those functions.
const pdfAssets = ["./public/fonts/DejaVu*.ttf", "./public/nba-seal.png"];

const nextConfig: NextConfig = {
  // Profile photos are rendered unoptimized (components/profile/avatar.tsx), so no remote image pattern is needed.
  outputFileTracingIncludes: {
    "/certificates/[id]/pdf": pdfAssets,
    "/transactions/[id]/invoice/pdf": pdfAssets,
    "/sw.js": ["./lib/pwa/service-worker.js"],
  },
  async headers() {
    return [
      {
        // Every response. Nothing here is meant to be framed, which also rules out clickjacking.
        // Listed first so the /sw.js rule below keeps its own Content-Security-Policy.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
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
