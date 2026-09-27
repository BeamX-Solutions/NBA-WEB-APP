import { NextResponse, type NextRequest } from "next/server";
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
  const { error } = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error) {
    const response = NextResponse.redirect(new URL(failure, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
