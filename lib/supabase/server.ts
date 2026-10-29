import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

export type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Verified user, or redirect to login. getClaims verifies the JWT signature locally (ES256 keys, JWKS
 * cached) instead of a round trip to the Auth server; cache() shares one result between layout and page.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/masuk");
  const c = data.claims;
  const user = { id: c.sub, email: c.email ?? "", user_metadata: (c.user_metadata ?? {}) as Record<string, unknown> };
  return { supabase, user };
});
