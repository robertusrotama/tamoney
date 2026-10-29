import type { Metadata } from "next";
import { BillList } from "@/components/bills/BillList";
import { PlanTabs } from "@/components/plan/PlanTabs";
import { Card, EmptyState } from "@/components/ui/EmptyState";
import { getPlanningState } from "@/lib/planning";
import { getCategories, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Rencana · TaMoney" };

export default async function RencanaPage({ searchParams }: PageProps<"/rencana">) {
  const { supabase } = await requireUser();
  const [s, allWallets, categories, sp] = await Promise.all([getPlanningState(supabase), getWallets(supabase, true), getCategories(supabase), searchParams]);
  const wallets = allWallets.filter((w) => !w.archived_at);
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-6">
      <h1 className="large-title px-1">Rencana</h1>
      <PlanTabs
        initial={sp.tab === "tagihan" ? "tagihan" : "goals"}
        bills={<BillList bills={s.bills} wallets={wallets} allWallets={allWallets} categories={expense} today={s.today} />}
        goals={
          <Card>
            <EmptyState icon="flag" title="Goals segera hadir" />
          </Card>
        }
      />
    </div>
  );
}
