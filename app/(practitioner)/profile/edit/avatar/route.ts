import { NextResponse } from "next/server";
import { avatarDisplayUrl, avatarPathFor, avatarPathFrom, isAvatarType, matchesAvatarSignature } from "@/lib/profile/avatar";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const maxAvatarSize = 2 * 1024 * 1024;

function json(body: { message: string; url?: string }, status: number): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ message: "The upload could not be authorized. Refresh and try again." }, 403);
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
  if (!isAvatarType(value.type)) return json({ message: "Choose a JPG, PNG, or WebP image." }, 400);
  if (value.size <= 0 || value.size > maxAvatarSize) return json({ message: "Choose an image smaller than 2 MB." }, 400);
  if (!matchesAvatarSignature(value.type, new Uint8Array(await value.slice(0, 12).arrayBuffer()))) return json({ message: "Choose a JPG, PNG, or WebP image." }, 400);

  const { url: supabaseUrl } = supabaseConfig();
  const before = await client.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
  const previousPath = avatarPathFrom(before.data?.avatar_url, supabaseUrl);

  // The path is built here from the session alone; nothing in the request names where the file goes.
  const path = avatarPathFor(user.id, value.type);
  const { error: uploadError } = await client.storage.from("avatars").upload(path, value, {
    cacheControl: "3600",
    contentType: value.type,
    upsert: false,
  });
  if (uploadError) return json({ message: "The photo could not be uploaded. Try again." }, 400);

  // Stored as the object path, as mobile stores it, so the photo shows in both apps.
  const { data: profile, error: updateError } = await client
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", user.id)
    .select("updated_at")
    .maybeSingle();
  if (updateError || !profile) return json({ message: "The photo uploaded, but your profile could not be refreshed. Try again." }, 400);

  // Best effort, and only ever inside this practitioner's own folder: a file left behind costs storage, not correctness.
  if (previousPath && previousPath !== path && previousPath.startsWith(`${user.id}/`)) {
    await client.storage.from("avatars").remove([previousPath]).catch(() => undefined);
  }

  const url = avatarDisplayUrl(path, supabaseUrl, typeof profile.updated_at === "string" ? profile.updated_at : null);
  return json({ message: "Profile photo updated.", url: url ?? undefined }, 200);
}
