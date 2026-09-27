import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const maxAvatarSize = 2 * 1024 * 1024;
const extensionByMime = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function json(body: { message: string; url?: string }, status: number): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return json({ message: "Your session expired. Log in again before uploading." }, 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ message: "The selected image could not be read." }, 400);
  }

  const value = formData.get("avatar");
  if (!(value instanceof File)) return json({ message: "Choose an image to upload." }, 400);
  const extension = extensionByMime.get(value.type);
  if (!extension) return json({ message: "Choose a JPG, PNG, or WebP image." }, 400);
  if (value.size <= 0 || value.size > maxAvatarSize) return json({ message: "Choose an image smaller than 2 MB." }, 400);

  const path = `${user.id}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await client.storage.from("avatars").upload(path, value, {
    cacheControl: "3600",
    contentType: value.type,
    upsert: false,
  });
  if (uploadError) return json({ message: "The photo could not be uploaded. Try again." }, 400);

  const { data: publicUrl } = client.storage.from("avatars").getPublicUrl(path);
  const { data: profile, error: updateError } = await client
    .from("profiles")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError || !profile) return json({ message: "The photo uploaded, but your profile could not be refreshed. Try again." }, 400);
  return json({ message: "Profile photo updated.", url: publicUrl.publicUrl }, 200);
}

