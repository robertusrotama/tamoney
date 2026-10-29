import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PosRow } from "@/components/budget/PosRow";
import { TxList, TxRow } from "@/components/transactions/TxRow";
import { Card, EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { monthLabel, nominalEnd, rangeLabel } from "@/lib/budget";
import { isoRange } from "@/lib/period";
import { getPlanningState, loadPeriodView } from "@/lib/planning";
import { getCategories, getTransactionsBetween, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pos budget · TaMoney" };

/** One pos in one salary period: what the money went to, by category, then every transaction. */
export default async function PosPage({ params, searchParams }: PageProps<"/budget/[pos]">) {
  const { supabase } = await requireUser();
  const [{ pos: posId }, sp, s, categories, wallets] = await Promise.all([params, searchParams, getPlanningState(supabase), getCategories(supabase), getWallets(supabase, true)]);
  const group = s.groups.find((g) => g.id === posId);
  if (!group || !s.current) notFound();

  const wanted = typeof sp.periode === "string" ? s.periods.findIndex((p) => p.month.startsWith(sp.periode as string)) : -1;
  const view = wanted >= 0 && wanted !== s.current.index ? await loadPeriodView(supabase, s, wanted) : s.current;
  const usage = view.usage.pos.find((p) => p.group.id === posId)!;
  const end = view.range.end ?? nominalEnd(view.range.start, s.payday);
  const { start, end: endIso } = isoRange(view.range.start, view.range.end ?? s.today);

  const inPos = new Set(categories.filter((c) => c.budget_group_id === posId).map((c) => c.id));
  const goalWallets = new Map(s.goals.map((g) => [g.id, g.wallet_id]));
  const rows = (await getTransactionsBetween(supabase, start, endIso)).filter(
    (t) =>
      (t.kind === "expense" && t.category_id && inPos.has(t.category_id)) ||
      (group.is_savings && t.kind === "transfer" && t.goal_id && [t.wallet_id, t.to_wallet_id].includes(goalWallets.get(t.goal_id) ?? "")),
  );

  // Per category (goal transfers grouped as "Setoran goal"), biggest first.
  const byCat = new Map<string, { name: string; icon: string; total: number; n: number }>();
  for (const t of rows) {
    const key = t.kind === "transfer" ? "goal" : t.category_id!;
    const sign = t.kind === "transfer" && t.wallet_id === goalWallets.get(t.goal_id!) ? -1 : 1;
    const cur = byCat.get(key) ?? { name: key === "goal" ? "Setoran goal" : (t.category_name ?? "—"), icon: key === "goal" ? "savings" : (t.category_icon ?? "more_horiz"), total: 0, n: 0 };
    byCat.set(key, { ...cur, total: cur.total + sign * t.amount, n: cur.n + 1 });
  }
  const breakdown = [...byCat.values()].sort((a, b) => b.total - a.total);
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const walletName = (id: string) => names.get(id) ?? "Diarsipkan";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="px-1">
        <Link href={`/budget?periode=${view.period.month.slice(0, 7)}`} className="mb-1 inline-flex items-center gap-0.5 text-[15px] text-primary">
          <Icon name="chevron_left" className="text-[20px]" /> Budget
        </Link>
        <h1 className="large-title">{group.name}</h1>
        <p className="text-[15px] text-on-surface-variant">
          Gaji {monthLabel(view.period.month)} · {rangeLabel(view.range.start, end)}
        </p>
      </div>

      <div className="overflow-hidden rounded-[14px] bg-card">
        <PosRow p={usage} />
      </div>

      {breakdown.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]">Dipakai untuk</h2>
          <div className="divide-y divide-outline overflow-hidden rounded-[14px] bg-card">
            {breakdown.map((c) => (
              <div key={c.name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-surface-dim text-on-surface-variant">
                  <Icon name={c.icon} className="text-[19px]" />
                </span>
                <span className="flex-1">
                  <span className="block text-[17px]">{c.name}</span>
                  <span className="text-[13px] text-on-surface-variant">{c.n} transaksi</span>
                </span>
                <span className="text-right">
                  <Money value={c.total} className="block text-[15px] font-semibold" />
                  {usage.used > 0 && <span className="text-[12px] text-on-surface-variant tabular-nums">{Math.round((c.total / usage.used) * 100)}%</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]">Transaksi</h2>
        {rows.length === 0 ? (
          <Card>
            <EmptyState icon="receipt_long" title="Belum ada transaksi di pos ini">
              <p className="text-[15px]">{inPos.size === 0 && !group.is_savings ? "Pos ini belum punya kategori. Atur di Pengaturan." : "Periode ini masih bersih."}</p>
            </EmptyState>
          </Card>
        ) : (
          <TxList>
            {rows.map((t) => (
              <TxRow key={t.id} tx={t} walletName={walletName} showDate />
            ))}
          </TxList>
        )}
      </section>
    </div>
  );
}
