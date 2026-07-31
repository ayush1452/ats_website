import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({
      request: { headers: request.headers },
      headers: { "x-resumepilot-mode": "demo" },
    });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as { is_anonymous?: boolean } | undefined;
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");
  const isAuthRoute =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

  if (isAppRoute && (error || !data?.claims)) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/auth/session-expired";
    destination.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(destination);
  }

  if (isAuthRoute && claims && !claims.is_anonymous) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/app";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
