"use client";

import { useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { Card, EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { setBillArchived, skipBill } from "@/lib/actions/bills";
import { dueLabel, dueStatus, monthTotal } from "@/lib/bills";
import type { Bill, Category, Wallet } from "@/lib/types";
import { BillDialog } from "./BillForm";
import { PayBillButton } from "./PayBill";

const CADENCE_LABEL = { weekly: "Mingguan", monthly: "Bulanan", yearly: "Tahunan" };
const shortDate = (d: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const days = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);

function BillRow({ bill, wallets, allWallets, categories, today }: { bill: Bill; wallets: Wallet[]; allWallets: Wallet[]; categories: Category[]; today: string }) {
  const [confirm, dialog] = useConfirm();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const s = dueStatus(bill, today);
  const wallet = allWallets.find((w) => w.id === bill.wallet_id)?.name;
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => setError((await fn()).error));

  const skip = async () => {
    if (await confirm({ title: `Lewati ${bill.name}?`, message: `Jatuh tempo pindah ke periode berikutnya tanpa mencatat pengeluaran.`, confirmLabel: "Lewati" }))
      run(() => skipBill(bill.id, bill.next_due));
  };
  const archive = async () => {
    if (await confirm({ title: `Arsipkan ${bill.name}?`, message: "Tagihan berhenti diingatkan. Riwayat pembayarannya tetap tersimpan.", confirmLabel: "Arsipkan", destructive: true }))
      run(() => setBillArchived(bill.id, true));
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${s.kind === "late" ? "bg-negative-container text-negative" : "bg-primary-container text-primary"}`}>
        <Icon name={bill.icon} className="text-[20px]" filled />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px]">{bill.name}</p>
        <p className="truncate text-[13px] text-on-surface-variant">
          <span className={s.kind === "late" ? "font-semibold text-negative" : s.kind === "soon" ? "font-semibold text-warning" : ""}>
            {s.kind === "later" ? shortDate(bill.next_due) : dueLabel(s)}
          </span>
          {" · "}
          {CADENCE_LABEL[bill.cadence]}
          {wallet && ` · ${wallet}`}
        </p>
        {error && <p className="text-[13px] text-negative">{error}</p>}
      </div>
      <Money value={bill.amount} className="hidden text-[15px] font-semibold sm:inline" />
      <PayBillButton bill={bill} wallets={wallets} />
      <div className="-mr-2 flex">
        <BillDialog bill={bill} wallets={wallets} categories={categories} variant="icon">
          <Icon name="edit" className="text-[18px]" />
        </BillDialog>
        <IconButton aria-label={`Lewati ${bill.name} periode ini`} onClick={skip} disabled={pending}>
          <Icon name="skip_next" className="text-[20px]" />
        </IconButton>
        <IconButton aria-label={`Arsipkan ${bill.name}`} onClick={archive} disabled={pending}>
          <Icon name="archive" className="text-[18px]" />
        </IconButton>
      </div>
      {dialog}
    </div>
  );
}

/** Rencana → Tagihan: late, next 7 days, later; archived at the bottom. */
export function BillList({ bills, wallets, allWallets, categories, today }: { bills: Bill[]; wallets: Wallet[]; allWallets: Wallet[]; categories: Category[]; today: string }) {
  const [pending, start] = useTransition();
  const active = bills.filter((b) => !b.archived_at);
  const archived = bills.filter((b) => b.archived_at);
  const sections = [
    { title: "Terlambat", items: active.filter((b) => b.next_due < today) },
    { title: "7 hari ke depan", items: active.filter((b) => b.next_due >= today && days(today, b.next_due) <= 7) },
    { title: "Nanti", items: active.filter((b) => days(today, b.next_due) > 7) },
  ].filter((s) => s.items.length);
  const row = { wallets, allWallets, categories, today };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.04em] text-on-surface-variant uppercase">Tagihan tersisa bulan ini</p>
          <Money value={monthTotal(active, today.slice(0, 7))} className="block text-[34px] leading-tight font-bold tracking-[-0.02em]" />
          <p className="text-[15px] text-on-surface-variant">{active.length} tagihan rutin aktif</p>
        </div>
        <BillDialog wallets={wallets} categories={categories}>
          <Icon name="add" className="text-[18px]" /> Tambah tagihan
        </BillDialog>
      </div>

      {active.length === 0 && (
        <Card>
          <EmptyState icon="receipt_long" title="Belum ada tagihan rutin">
            <p className="max-w-sm text-[15px]">Catat pengeluaran berulang seperti Netflix, kost, wifi, atau listrik. Kamu diingatkan sebelum jatuh tempo.</p>
          </EmptyState>
        </Card>
      )}

      {sections.map((s) => (
        <section key={s.title}>
          <h2 className={`mb-2 px-1 text-[20px] font-bold tracking-[-0.01em] ${s.title === "Terlambat" ? "text-negative" : ""}`}>{s.title}</h2>
          <div className="divide-y divide-outline overflow-hidden rounded-[14px] bg-card">
            {s.items.map((b) => (
              <BillRow key={b.id} bill={b} {...row} />
            ))}
          </div>
        </section>
      ))}

      {archived.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 px-1 text-[15px] font-semibold text-on-surface-variant">
            <Icon name="chevron_right" className="text-[20px] transition-transform group-open:rotate-90" /> Diarsipkan ({archived.length})
          </summary>
          <div className="mt-2 divide-y divide-outline overflow-hidden rounded-[14px] bg-card">
            {archived.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                <Icon name={b.icon} className="text-[20px] text-on-surface-variant" />
                <span className="flex-1 truncate text-[17px]">{b.name}</span>
                <Button variant="tonal" size="sm" disabled={pending} onClick={() => start(async () => void (await setBillArchived(b.id, false)))}>
                  Pulihkan
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
