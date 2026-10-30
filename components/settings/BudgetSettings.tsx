"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { MultiSelect } from "@/components/analytics/Filters";
import { Button, IconButton } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { FormError, Input } from "@/components/ui/Field";
import { Ring, useFocusWithin } from "@/components/ui/FocusRing";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { Picker } from "@/components/ui/Picker";
import { Popover } from "@/components/ui/Popover";
import { resetBudgetDefaults, saveBudgetSettings } from "@/lib/actions/settings";
import { allocate } from "@/lib/budget";
import type { BudgetGroup, Category } from "@/lib/types";

const ICONS = [
  "savings", "home", "restaurant", "shopping_cart", "directions_car", "shopping_bag", "medical_services", "movie",
  "subscriptions", "volunteer_activism", "more_horiz", "bolt", "school", "pets", "child_care", "fitness_center",
  "flight", "local_cafe", "checkroom", "redeem", "phone_iphone", "spa", "sports_esports", "trending_up",
];

function PctField({ children }: { children: React.ReactNode }) {
  const { focused, focusProps } = useFocusWithin();
  return (
    <div {...focusProps} className="relative flex w-24 shrink-0 items-center rounded-[14px] bg-surface-dim pr-3">
      <Ring on={focused} />
      {children}
    </div>
  );
}

type Row = { key: string; id: string | null; name: string; icon: string; pct: string; is_savings: boolean; category_ids: string[] };

// Percent shown with up to 2 decimals so the defaults (33,33%) round-trip exactly to basis points.
const showPct = (bp: number) => (bp / 100).toLocaleString("id-ID", { maximumFractionDigits: 2 });
const toBp = (pct: string) => {
  const n = Number(pct.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

const toRows = (groups: BudgetGroup[], categories: Category[]): Row[] =>
  groups.map((g) => ({
    key: g.id,
    id: g.id,
    name: g.name,
    icon: g.icon,
    pct: showPct(g.pct_bp),
    is_savings: g.is_savings,
    category_ids: categories.filter((c) => c.budget_group_id === g.id).map((c) => c.id),
  }));

export function BudgetSettings({ groups, categories, payday: initialPayday, salary }: { groups: BudgetGroup[]; categories: Category[]; payday: number; salary: number }) {
  const [rows, setRows] = useState(() => toRows(groups, categories));
  const [payday, setPayday] = useState(String(initialPayday));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [confirm, dialog] = useConfirm();

  const total = rows.reduce((s, r) => s + (toBp(r.pct) || 0), 0);
  const valid = total === 10_000 && rows.every((r) => !Number.isNaN(toBp(r.pct)) && r.name.trim());
  const preview = allocate(salary, rows.map((r) => ({ id: r.key, pct_bp: toBp(r.pct) || 0, is_savings: r.is_savings })));
  const posOf = Object.fromEntries(rows.flatMap((r) => r.category_ids.map((c) => [c, r.name])));

  const edit = (key: string, patch: Partial<Row>) => {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  // Picking a category that sits in another pos moves it here.
  const pickCategories = (key: string, ids: string[]) => {
    setSaved(false);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, category_ids: ids } : { ...r, category_ids: r.category_ids.filter((c) => !ids.includes(c)) })));
  };

  const save = () =>
    start(async () => {
      const res = await saveBudgetSettings({
        payday: Number(payday),
        groups: rows.map((r) => ({ id: r.id, name: r.name.trim(), icon: r.icon, pct_bp: toBp(r.pct), is_savings: r.is_savings, category_ids: r.category_ids })),
      });
      setError(res.error);
      setSaved(!!res.ok);
    });

  const reset = async () => {
    if (!(await confirm({ title: "Kembalikan ke default?", message: "Pos, persentase, dan kategori kembali seperti awal. Periode yang sudah berjalan tidak berubah.", confirmLabel: "Kembalikan" }))) return;
    start(async () => {
      const res = await resetBudgetDefaults();
      setError(res.error);
      if (res.ok) window.location.reload(); // fresh ids for any re-created pos
    });
  };

  const remove = async (r: Row) => {
    if (!(await confirm({ title: `Hapus pos ${r.name}?`, message: "Kategorinya jadi belum masuk pos. Periode lama tetap menyimpan alokasinya sampai disimpan.", confirmLabel: "Hapus", destructive: true }))) return;
    setSaved(false);
    setRows((rs) => rs.filter((x) => x.key !== r.key));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-[14px] bg-card px-4 py-3">
        <div>
          <p className="text-[17px]">Tanggal gajian</p>
          <p className="text-[13px] text-on-surface-variant">Periode budget dimulai saat gaji dicatat</p>
        </div>
        <div className="w-24">
          <Picker label="Tanggal gajian" value={payday} onChange={(v) => (setPayday(v), setSaved(false))} options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} />
        </div>
      </div>

      <div className="divide-y divide-outline overflow-hidden rounded-[14px] bg-card">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div key={r.key} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:flex-nowrap">
                <Popover variant="pill" width={232} ariaLabel={`Ikon ${r.name}`} label={<Icon name={r.icon} className="text-[20px] text-primary" filled />}>
                  {(close) => (
                    <div className="grid grid-cols-6 gap-1 p-1">
                      {ICONS.map((i) => (
                        <IconButton
                          key={i}
                          aria-label={i}
                          tone={i === r.icon ? "primary" : "muted"}
                          className={i === r.icon ? "bg-primary-container" : ""}
                          onClick={() => {
                            edit(r.key, { icon: i });
                            close();
                          }}
                        >
                          <Icon name={i} className="text-[20px]" />
                        </IconButton>
                      ))}
                    </div>
                  )}
                </Popover>
                <div className="min-w-0 flex-1">
                  <Input aria-label="Nama pos" value={r.name} maxLength={40} onChange={(e) => edit(r.key, { name: e.target.value })} className="h-10" />
                </div>
                <PctField>
                  <input
                    aria-label={`Persentase ${r.name}`}
                    inputMode="decimal"
                    value={r.pct}
                    onChange={(e) => edit(r.key, { pct: e.target.value.replace(/[^\d.,]/g, "") })}
                    className="h-10 w-full min-w-0 bg-transparent pl-3 text-right text-[17px] tabular-nums outline-none"
                  />
                  <span className="pl-0.5 text-[15px] text-on-surface-variant">%</span>
                </PctField>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="flex-1 sm:flex-none">
                    <MultiSelect
                      label="Kategori"
                      selected={r.category_ids}
                      onChange={(ids) => pickCategories(r.key, ids)}
                      options={categories.map((c) => ({ value: c.id, label: c.name, icon: c.icon, hint: posOf[c.id] && posOf[c.id] !== r.name ? posOf[c.id] : undefined }))}
                    />
                  </div>
                  <span className="w-28 text-right text-[13px] text-on-surface-variant tabular-nums">
                    <Money value={preview[r.key] ?? 0} />
                  </span>
                  {r.is_savings ? (
                    <span className="flex size-9 items-center justify-center" title="Pos tabungan tidak bisa dihapus">
                      <Icon name="lock" className="text-[18px] text-on-surface-variant" />
                    </span>
                  ) : (
                    <IconButton aria-label={`Hapus pos ${r.name}`} onClick={() => remove(r)}>
                      <Icon name="delete" className="text-[20px]" />
                    </IconButton>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setRows((rs) => [...rs, { key: crypto.randomUUID(), id: null, name: `Pos baru ${rs.length + 1}`, icon: "more_horiz", pct: "0", is_savings: false, category_ids: [] }])
            }
          >
            <Icon name="add" className="text-[16px]" /> Tambah pos
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={reset} disabled={pending}>
          <Icon name="restart_alt" className="text-[16px]" /> Kembalikan ke default
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-card px-4 py-3">
        <div className="mr-auto min-w-0">
          <p className={`text-[17px] font-semibold tabular-nums ${total === 10_000 ? "" : "text-negative"}`}>Total {showPct(total)}%</p>
          <p className="truncate text-[13px] text-on-surface-variant">
            {total === 10_000 ? (
              <>
                Pratinjau gaji <Money value={salary} />
              </>
            ) : (
              "Harus tepat 100% untuk disimpan"
            )}
          </p>
        </div>
        <Button onClick={save} disabled={!valid || pending}>
          {pending ? "Menyimpan…" : saved ? "Tersimpan" : "Simpan"}
        </Button>
      </div>
      <FormError message={error} />
      {dialog}
    </div>
  );
}
