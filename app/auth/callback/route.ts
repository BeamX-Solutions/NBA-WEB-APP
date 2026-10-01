import { NextResponse, type NextRequest } from "next/server";
import { ADMINISTRATOR_PATH, loadPractitionerAccess } from "@/lib/practitioner/access";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const recovery = request.nextUrl.searchParams.get("flow") === "recovery";
  const destination = recovery ? "/reset-password" : "/";
  const failure = recovery ? "/forgot-password?auth_error=link" : "/login?auth_error=link";

  if (!code) {
    const response = NextResponse.redirect(new URL(failure, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const client = await createClient();
  const { data, error } = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error) {
    const response = NextResponse.redirect(new URL(failure, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  // Recovery included: /reset-password is outside the proxy, so an administrator is signed out here.
  const access = await loadPractitionerAccess(client, data.user.id);
  if (access.kind === "administrator") {
    await client.auth.signOut();
    const response = NextResponse.redirect(new URL(ADMINISTRATOR_PATH, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
