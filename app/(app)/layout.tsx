import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/Nav";
import { SIDEBAR_COOKIE } from "@/components/shell/prefs";
import { QuickAdd } from "@/components/shell/QuickAdd";
import { UserMenu } from "@/components/shell/UserMenu";
import { getCategories, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const [wallets, categories, cookieStore] = await Promise.all([getWallets(supabase), getCategories(supabase), cookies()]);
  const name = (user.user_metadata.display_name as string | undefined) || user.email!.split("@")[0];

  return (
    <AppShell
      initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
      header={
        <header className="sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] md:justify-end md:pr-6 md:pl-0">
          <p className="glass rounded-full px-4 py-1.5 text-[17px] font-semibold md:hidden">TaMoney</p>
          <div className="glass flex items-center gap-1.5 rounded-full p-1">
            <QuickAdd wallets={wallets} categories={categories} />
            <UserMenu name={name} email={user.email!} />
          </div>
        </header>
      }
    >
      {children}
    </AppShell>
  );
}
