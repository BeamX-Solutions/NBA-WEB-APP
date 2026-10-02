import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./server";

/**
 * The Supabase client and signed-in user for this server render, created once and shared by the
 * layout, the page and every loader they call. React's cache is per request, so nothing is shared
 * between users or requests.
 *
 * Server actions and route handlers are requests of their own and keep their own checks.
 */
export const getServerClient = cache(createClient);

/** One auth.getUser() per render: it verifies the session with Supabase Auth, so it is a round trip. */
export const getSessionUser = cache(async (): Promise<User | null> => {
  try {
    const client = await getServerClient();
    const { data: { user }, error } = await client.auth.getUser();
    return error ? null : user;
  } catch {
    return null;
  }
});

/** The shared client and user for a page that needs a session; otherwise to login, then back to `nextPath`. */
export async function requireSession(nextPath: string): Promise<{ client: SupabaseClient; user: User }> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return { client: await getServerClient(), user };
}
