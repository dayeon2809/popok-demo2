import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, localeFromPathname, stripLocalePrefix } from "@/lib/i18n/locale";

export async function proxy(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const locale = localeFromPathname(originalPathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-popok-locale", locale);
  requestHeaders.set("x-popok-pathname", originalPathname);

  const createResponse = () => {
    if (locale === "en") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = stripLocalePrefix(originalPathname);
      return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  let response = createResponse();
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        response = createResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        response.cookies.set(LOCALE_COOKIE, locale, {
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
        });
      },
    },
  });

  // This will refresh the session cookie if it is expired
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
