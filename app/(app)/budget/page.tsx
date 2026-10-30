import type { Metadata } from "next";
import Link from "next/link";
import { PeriodPicker, PosRow } from "@/components/budget/PosRow";
import { DeleteSalaryButton, SalaryButton } from "@/components/budget/SalaryForm";
import { Card, EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { monthLabel, nominalEnd, rangeLabel, safePerDay } from "@/lib/budget";
import { localeOf } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { formatRupiah } from "@/lib/money";
import { getPlanningState, loadPeriodView } from "@/lib/planning";
import { getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Budget · TaMoney" };

const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);

export default async function BudgetPage({ searchParams }: PageProps<"/budget">) {
  const { supabase } = await requireUser();
  const [s, wallets, sp, t, lang] = await Promise.all([getPlanningState(supabase), getWallets(supabase), searchParams, getT(), getLang()]);
  const locale = localeOf(lang);
  const salaryProps = { groups: s.groups, periods: s.periods, wallets, today: s.today, payday: s.payday, salaryWallet: s.salaryWallet };

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <h1 className="large-title">Budget</h1>
      <SalaryButton {...salaryProps} variant="tonal">
        <Icon name="payments" className="text-[18px]" /> {t("Catat gaji")}
      </SalaryButton>
    </div>
  );

  if (s.periods.length === 0 || !s.current) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <EmptyState icon="pie_chart" title={t("Catat gaji untuk mulai periode budget")}>
            <p className="max-w-sm text-[15px]">
              {t("Gaji dibagi otomatis ke pos seperti Makanan, Rumah & Kost, dan Tabungan. Persentasenya bisa diatur di Pengaturan.")}
            </p>
          </EmptyState>
        </Card>
      </div>
    );
  }

  const wanted = typeof sp.periode === "string" ? s.periods.findIndex((p) => p.month.startsWith(sp.periode as string)) : -1;
  const view = wanted >= 0 && wanted !== s.current.index ? await loadPeriodView(supabase, s, wanted) : s.current;
  const { period, range, usage } = view;
  const running = range.end === null;
  const end = range.end ?? nominalEnd(range.start, s.payday);
  const spendable = usage.pos.filter((p) => !p.group.is_savings).reduce((a, p) => a + p.limit, 0);
  const leftover = spendable - usage.spent;
  const daysLeft = Math.max(0, daysBetween(s.today, end) + 1);
  const goalNeed = s.goals.reduce((a, g) => a + g.need, 0);
  const savings = usage.pos.find((p) => p.group.is_savings);

  return (
    <div className="space-y-6">
      {header}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.04em] text-on-surface-variant uppercase">
              {t("Gaji {month} · {range}", { month: monthLabel(period.month, locale), range: rangeLabel(range.start, end, locale) })}
            </p>
            <Money
              value={leftover}
              className={`block text-[clamp(2rem,1.5rem+2.5vw,2.75rem)] leading-tight font-bold tracking-[-0.03em] ${leftover < 0 ? "text-negative" : ""}`}
            />
            <p className="text-[15px] text-on-surface-variant">{leftover < 0 ? t("lebih dari budget belanja") : t("sisa untuk belanja")}</p>
          </div>
          <PeriodPicker
            value={period.month.slice(0, 7)}
            options={[...s.periods].reverse().map((p) => ({ value: p.month.slice(0, 7), label: monthLabel(p.month, locale) }))}
          />
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            period.topup
              ? [t("Gaji + pemasukan"), <Money key="g" value={period.salary + period.topup} />]
              : [t("Gaji"), <Money key="g" value={period.salary} />],
            [t("Terpakai"), <Money key="t" value={usage.spent} />],
            running ? [t("Aman per hari"), <Money key="a" value={safePerDay(usage.pos, s.today, end)} />] : [t("Periode"), t("Selesai")],
            running ? [t("Hari tersisa"), t("{n} hari", { n: daysLeft })] : [t("Ditabung"), <Money key="d" value={savings?.used ?? 0} />],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-[12px] bg-surface-dim/60 px-3 py-2">
              <dt className="text-[13px] text-on-surface-variant">{k}</dt>
              <dd className="text-[17px] font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <SalaryButton {...salaryProps} month={period.month.slice(0, 7)} variant="tonal" size="sm">
            <Icon name="edit" className="text-[16px]" /> {t("Ubah gaji")}
          </SalaryButton>
          <DeleteSalaryButton periodId={period.id} label={monthLabel(period.month, locale)} />
        </div>
        {!running && leftover > 0 && (
          <Link
            href="/rencana?tab=goals"
            className="flex items-center gap-2 rounded-[12px] bg-positive-container px-3 py-2.5 text-[15px] font-medium text-positive"
          >
            <Icon name="savings" className="text-[20px]" filled />
            <span className="flex-1">
              {t("Sisa")} <Money value={leftover} /> — {t("pindahkan ke goal")}
            </span>
            <Icon name="chevron_right" className="text-[20px]" />
          </Link>
        )}
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[20px] font-bold tracking-[-0.01em]">{t("Pos budget")}</h2>
          <SalaryButton {...salaryProps} month={period.month.slice(0, 7)} variant="ghost">
            {t("Ubah alokasi")}
          </SalaryButton>
        </div>
        <div className="divide-y divide-outline overflow-hidden rounded-[14px] bg-card">
          {usage.pos.map((p) => (
            <PosRow
              key={p.group.id}
              p={p}
              href={`/budget/${p.group.id}?periode=${period.month.slice(0, 7)}`}
              note={
                p.group.is_savings && goalNeed > 0
                  ? t("Kebutuhan setoran goal {need} dari alokasi {limit}", { need: formatRupiah(goalNeed), limit: formatRupiah(p.limit) })
                  : undefined
              }
            />
          ))}
          {usage.unassigned > 0 && (
            <Link href="/pengaturan/budget" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-dim">
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-surface-dim text-on-surface-variant">
                <Icon name="help" className="text-[20px]" />
              </span>
              <span className="flex-1">
                <span className="block text-[17px]">{t("Belum masuk pos")}</span>
                <span className="text-[13px] text-on-surface-variant">{t("Atur kategorinya di Pengaturan")}</span>
              </span>
              <Money value={usage.unassigned} className="text-[15px] font-semibold" />
              <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
