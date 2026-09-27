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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: avatarRemotePatterns(),
  },
};

export default nextConfig;
