import type { Metadata } from "next";
import { BillList } from "@/components/bills/BillList";
import { PlanTabs } from "@/components/plan/PlanTabs";
import { GoalList } from "@/components/goals/GoalList";
import { getPlanningState } from "@/lib/planning";
import { getCategories, getWallets } from "@/lib/queries";
import { getT } from "@/lib/i18n-server";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Rencana · TaMoney" };

export default async function RencanaPage({ searchParams }: PageProps<"/rencana">) {
  const { supabase } = await requireUser();
  const [s, allWallets, categories, sp, t] = await Promise.all([
    getPlanningState(supabase),
    getWallets(supabase, true),
    getCategories(supabase),
    searchParams,
    getT(),
  ]);
  const wallets = allWallets.filter((w) => !w.archived_at);
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-6">
      <h1 className="large-title px-1">{t("Rencana")}</h1>
      <PlanTabs
        initial={sp.tab === "tagihan" ? "tagihan" : "goals"}
        bills={<BillList bills={s.bills} wallets={wallets} allWallets={allWallets} categories={expense} today={s.today} />}
        goals={<GoalList goals={s.goals} wallets={wallets} allWallets={allWallets} payday={s.payday} periodMonth={s.periodMonth} today={s.today} />}
      />
    </div>
  );
}
