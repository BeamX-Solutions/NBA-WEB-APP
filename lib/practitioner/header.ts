import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type HeaderIdentity = { signedIn: boolean; avatarUrl: string | null; unreadCount: number };

/** What the app header shows on the right: the bell, the practitioner's photo, or a way to log in. Cached per request. */
export const loadHeaderIdentity = cache(async (): Promise<HeaderIdentity> => {
  try {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { signedIn: false, avatarUrl: null, unreadCount: 0 };
    const [profile, unread] = await Promise.all([
      client.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
      // RLS limits this to the practitioner's own; a failed count shows no badge rather than an error.
      client.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    ]);
    const avatarUrl = typeof profile.data?.avatar_url === "string" && profile.data.avatar_url ? profile.data.avatar_url : null;
    return { signedIn: true, avatarUrl, unreadCount: unread.error ? 0 : unread.count ?? 0 };
  } catch {
    return { signedIn: false, avatarUrl: null, unreadCount: 0 };
  }
});
