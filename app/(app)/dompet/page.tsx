import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";
import { RestoreButton, WalletStack } from "@/components/wallets/WalletCard";
import { WalletDialog } from "@/components/wallets/WalletForm";
import { WALLET_ICON } from "@/components/wallets/style";
import { walletActivity } from "@/lib/activity";
import { getWalletActivity, getWallets } from "@/lib/queries";
import { wibDate, wibTime } from "@/lib/reports";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dompet · TaMoney" };

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(wibDate(iso)));

const TILE = { income: "bg-positive", expense: "bg-negative", transfer: "bg-tertiary" } as const;

export default async function DompetPage({ searchParams }: PageProps<"/dompet">) {
  const { dompet } = await searchParams;
  const { supabase } = await requireUser();
  const all = await getWallets(supabase, true);
  const active = all.filter((w) => !w.archived_at);
  const archived = all.filter((w) => w.archived_at);
  const total = active.reduce((s, w) => s + w.balance, 0);
  const names = new Map(all.map((w) => [w.id, w.name]));
  const selected = active.find((w) => w.id === dompet) ?? active[0];
  const activity = selected ? walletActivity(await getWalletActivity(supabase, selected.id), selected.id, selected.balance) : [];
  const h2 = "text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <h1 className="large-title">Dompet</h1>
          <p className="text-[15px] text-on-surface-variant">
            {active.length} aktif · total <Money value={total} className="font-semibold text-on-surface" />
          </p>
        </div>
        <WalletDialog variant="tonal">
          <Icon name="add" className="text-[18px]" /> Tambah
        </WalletDialog>
      </div>

      {!selected ? (
        <Card>
          <EmptyState icon="account_balance_wallet" title="Belum ada dompet">
            <p className="text-[15px]">Buat dompet pertama: tunai, rekening bank, atau e-wallet.</p>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <section className="lg:sticky lg:top-20">
            <WalletStack wallets={active} selectedId={selected.id} />
          </section>

          {/* Statement of the selected wallet: every change with the balance right after it */}
          <section className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className={h2}>Aktivitas {selected.name}</h2>
              <Link href={`/analitik?dompet=${selected.id}`} className="text-[15px] text-primary">
                Semua di Analitik
              </Link>
            </div>
            {activity.length === 0 ? (
              <Card>
                <EmptyState icon="receipt_long" title="Belum ada aktivitas">
                  <p className="text-[15px]">Transaksi dan transfer dompet ini muncul di sini.</p>
                </EmptyState>
              </Card>
            ) : (
              <div className="overflow-hidden rounded-[14px] bg-card [&>*:last-child>div]:border-0">
                {activity.map((t, i) => {
                  const transfer = t.kind === "transfer";
                  const other = transfer ? (names.get(t.delta > 0 ? t.wallet_id : t.to_wallet_id!) ?? "—") : null;
                  const title = transfer ? (t.delta > 0 ? `Transfer dari ${other}` : `Transfer ke ${other}`) : t.note || t.category_name || "Transaksi";
                  return (
                    <FadeIn key={t.id} index={i}>
                      <div className="flex items-center gap-3 border-b border-outline px-4 py-2.5">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] text-white ${TILE[t.kind]}`}>
                          <Icon
                            name={transfer ? (t.delta > 0 ? "south_west" : "north_east") : (t.category_icon ?? "receipt")}
                            className="text-[19px]"
                            filled
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[17px] leading-tight">{title}</p>
                          <p className="truncate text-[13px] text-on-surface-variant tabular-nums">
                            {shortDate(t.occurred_at)}, {wibTime(t.occurred_at)}
                            {!transfer && t.note && t.category_name ? ` · ${t.category_name}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Money value={t.delta} sign="auto" className="text-[17px] font-medium" />
                          <p className="text-[13px] text-on-surface-variant tabular-nums">
                            Saldo <Money value={t.balanceAfter} />
                          </p>
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}
            {activity.length === 50 && <Label className="mt-2 px-1">Menampilkan 50 aktivitas terakhir.</Label>}
          </section>
        </div>
      )}

      {archived.length > 0 && (
        <section>
          <h2 className={`mb-1 px-1 ${h2}`}>Diarsipkan</h2>
          <Label className="mb-2 px-1">Tidak muncul di pilihan dan total saldo. Riwayatnya tetap tersimpan.</Label>
          <div className="overflow-hidden rounded-[14px] bg-card">
            {archived.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border-b border-outline px-4 py-2.5 last:border-0">
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-surface-dim text-on-surface-variant">
                  <Icon name={WALLET_ICON[w.type]} className="text-[19px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px]">{w.name}</p>
                  <p className="text-[13px] text-on-surface-variant">
                    Saldo terakhir <Money value={w.balance} />
                  </p>
                </div>
                <RestoreButton id={w.id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
