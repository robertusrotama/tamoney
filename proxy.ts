import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/masuk", "/daftar", "/lupa-password"];
// pintasan: token auth, no session. manifest/icons: fetched by the OS without cookies when installing.
const PUBLIC = [...AUTH_PAGES, "/reset-password", "/auth/", "/api/pintasan", "/manifest.webmanifest", "/icons/"];

// Refreshes the Supabase session cookie and does the optimistic login redirect.
// Real authorization is RLS + requireUser().
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims refreshes an expiring session (writing cookies via setAll) and verifies the JWT locally.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;
  const path = request.nextUrl.pathname;
  const redirectTo = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!user && !PUBLIC.some((p) => path.startsWith(p))) return redirectTo("/masuk");
  if (user && AUTH_PAGES.includes(path)) return redirectTo("/");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
