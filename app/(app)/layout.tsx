import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/Nav";
import { SIDEBAR_COOKIE } from "@/components/shell/prefs";
import { Notifications } from "@/components/shell/Notifications";
import { QuickAdd } from "@/components/shell/QuickAdd";
import { UserMenu } from "@/components/shell/UserMenu";
import { buildNotifications } from "@/lib/notifications";
import { getPlanningState } from "@/lib/planning";
import { getCategories, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const [wallets, categories, plan, cookieStore] = await Promise.all([getWallets(supabase), getCategories(supabase), getPlanningState(supabase), cookies()]);
  const notices = buildNotifications(plan, plan.today, Object.fromEntries(wallets.map((w) => [w.id, w.name])));
  const name = (user.user_metadata.display_name as string | undefined) || user.email!.split("@")[0];

  return (
    <AppShell
      initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
      header={
        <header className="sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] md:justify-end md:pr-6 md:pl-0">
          <p className="glass rounded-full px-4 py-1.5 text-[17px] font-semibold md:hidden">TaMoney</p>
          <div className="glass flex items-center gap-1.5 rounded-full p-1">
            <QuickAdd wallets={wallets} categories={categories} />
            <Notifications notices={notices} bills={plan.bills} goals={plan.goals} wallets={wallets} />
            <UserMenu name={name} email={user.email!} />
          </div>
        </header>
      }
    >
      {children}
    </AppShell>
  );
}
