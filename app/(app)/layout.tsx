import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/Nav";
import { HIDE_BALANCE_COOKIE, SIDEBAR_COOKIE } from "@/components/shell/prefs";
import { PrivacyProvider } from "@/components/ui/Privacy";
import { Notifications } from "@/components/shell/Notifications";
import { QuickAdd } from "@/components/shell/QuickAdd";
import { UserMenu } from "@/components/shell/UserMenu";
import { localeOf, makeT } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { monthLabel } from "@/lib/budget";
import { buildNotifications } from "@/lib/notifications";
import { getPlanningState } from "@/lib/planning";
import { getCategories, getProfile, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const [wallets, categories, plan, profile, cookieStore] = await Promise.all([
    getWallets(supabase),
    getCategories(supabase),
    getPlanningState(supabase),
    getProfile(supabase, user.email),
    cookies(),
  ]);
  const lang = await getLang();
  const budgetPeriod = plan.current ? { id: plan.current.period.id, label: monthLabel(plan.current.period.month, localeOf(lang)) } : undefined;
  const notices = buildNotifications(plan, plan.today, Object.fromEntries(wallets.map((w) => [w.id, w.name])), makeT(lang), localeOf(lang));

  return (
    <PrivacyProvider initial={cookieStore.get(HIDE_BALANCE_COOKIE)?.value === "1"}>
      <AppShell
        initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
        header={
          <header className="sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] md:justify-end md:pr-6 md:pl-0">
            <p className="glass rounded-full px-4 py-1.5 text-[17px] font-semibold md:hidden">TaMoney</p>
            <div className="glass flex items-center gap-1.5 rounded-full p-1">
              <QuickAdd wallets={wallets} categories={categories} budgetPeriod={budgetPeriod} />
              <Notifications notices={notices} bills={plan.bills} goals={plan.goals} wallets={wallets} owed={plan.owed} />
              <UserMenu profile={profile} email={user.email} />
            </div>
          </header>
        }
      >
        {children}
      </AppShell>
    </PrivacyProvider>
  );
}
