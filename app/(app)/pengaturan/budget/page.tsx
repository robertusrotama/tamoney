import type { Metadata } from "next";
import Link from "next/link";
import { BudgetSettings } from "@/components/settings/BudgetSettings";
import { Icon } from "@/components/ui/Icon";
import { getPlanningState } from "@/lib/planning";
import { getCategories } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan Budget · TaMoney" };

export default async function BudgetSettingsPage() {
  const { supabase } = await requireUser();
  const [s, categories] = await Promise.all([getPlanningState(supabase), getCategories(supabase)]);
  return (
    <div className="max-w-4xl space-y-6">
      <div className="px-1">
        <Link href="/pengaturan" className="mb-1 inline-flex items-center gap-0.5 text-[15px] text-primary">
          <Icon name="chevron_left" className="text-[20px]" /> Pengaturan
        </Link>
        <h1 className="large-title">Budget</h1>
        <p className="text-[15px] text-on-surface-variant">
          Persentase gaji per pos dan kategori yang masuk ke tiap pos. Berlaku untuk gaji berikutnya; periode berjalan diubah lewat &ldquo;Ubah alokasi&rdquo; di Budget.
        </p>
      </div>
      <BudgetSettings groups={s.groups} categories={categories.filter((c) => c.kind === "expense")} payday={s.payday} salary={s.periods.at(-1)?.salary ?? 12_000_000} />
    </div>
  );
}
