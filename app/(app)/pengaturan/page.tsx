import type { Metadata } from "next";
import Link from "next/link";
import { BudgetSettings } from "@/components/settings/BudgetSettings";
import { Icon } from "@/components/ui/Icon";
import { getPlanningState } from "@/lib/planning";
import { getCategories } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan · TaMoney" };

export default async function PengaturanPage() {
  const { supabase } = await requireUser();
  const [s, categories] = await Promise.all([getPlanningState(supabase), getCategories(supabase)]);
  const h2 = "mb-1 px-1 text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="large-title px-1">Pengaturan</h1>

      <section>
        <h2 className={h2}>Budget</h2>
        <p className="mb-3 px-1 text-[15px] text-on-surface-variant">
          Persentase gaji per pos dan kategori yang masuk ke tiap pos. Berlaku untuk gaji berikutnya; periode berjalan diubah lewat &ldquo;Ubah alokasi&rdquo; di Budget.
        </p>
        <BudgetSettings
          groups={s.groups}
          categories={categories.filter((c) => c.kind === "expense")}
          payday={s.payday}
          salary={s.periods.at(-1)?.salary ?? 12_000_000}
        />
      </section>

      <section>
        <h2 className={`${h2} mb-3`}>Lainnya</h2>
        <Link href="/pintasan" className="flex items-center gap-3 rounded-[14px] bg-card px-4 py-3 hover:bg-surface-dim">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-container text-primary">
            <Icon name="bolt" className="text-[20px]" filled />
          </span>
          <span className="flex-1">
            <span className="block text-[17px]">Pintasan iPhone</span>
            <span className="text-[13px] text-on-surface-variant">Catat transaksi dari Shortcut dan Siri</span>
          </span>
          <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
        </Link>
      </section>
    </div>
  );
}
