import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

const sessionHeaders = ["cache-control", "expires", "pragma"] as const;

function copySessionState(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  sessionHeaders.forEach((name) => {
    const value = source.headers.get(name);
    if (value) target.headers.set(name, value);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  const recoveryCode = request.nextUrl.pathname === "/" ? request.nextUrl.searchParams.get("code") : null;
  if (recoveryCode) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", recoveryCode);
    callback.searchParams.set("flow", "recovery");
    const flowId = request.nextUrl.searchParams.get("sb_flow_id");
    if (flowId) callback.searchParams.set("sb_flow_id", flowId);
    return NextResponse.redirect(callback);
  }

  const { url, key } = supabaseConfig();
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items, headers) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data, error } = await client.auth.getClaims();
  if (!data?.claims || error) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return copySessionState(response, NextResponse.redirect(login));
  }

  return response;
}

export const config = {
  matcher: ["/", "/profile/:path*", "/transactions/:path*", "/certificates/:path*"],
};
