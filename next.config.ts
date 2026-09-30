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
const pdfAssets = ["./public/fonts/**/*", "./public/nba-seal.png"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: avatarRemotePatterns(),
  },
  outputFileTracingIncludes: {
    "/certificates/[id]/pdf": pdfAssets,
    "/transactions/[id]/invoice/pdf": pdfAssets,
  },
};

export default nextConfig;
