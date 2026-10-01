import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type HeaderIdentity = { signedIn: boolean; avatarUrl: string | null };

/** What the app header shows on the right: the practitioner's photo, or a way to log in. Cached per request. */
export const loadHeaderIdentity = cache(async (): Promise<HeaderIdentity> => {
  try {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { signedIn: false, avatarUrl: null };
    const { data } = await client.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
    const avatarUrl = typeof data?.avatar_url === "string" && data.avatar_url ? data.avatar_url : null;
    return { signedIn: true, avatarUrl };
  } catch {
    return { signedIn: false, avatarUrl: null };
  }
});
