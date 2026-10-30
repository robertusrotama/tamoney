"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { revealCard, setWalletArchived, walletDetail, type WalletDetail } from "@/lib/actions/wallets";
import type { CardData } from "@/lib/card-crypto";
import { Dialog } from "@/components/ui/Dialog";
import { FormError } from "@/components/ui/Field";
import { Bone } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
import { Money } from "@/components/ui/Money";
import { WALLET_TYPE_LABEL, type Wallet, type WalletType } from "@/lib/types";
import { WALLET_ICON } from "./style";
import { CARD_H, WalletFace } from "./WalletFace";
import { WalletDialog } from "./WalletForm";
import { useLocale, useT } from "@/components/I18n";

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const t = useT();
  return (
    <Button variant="tonal" size="sm" disabled={pending} onClick={() => start(() => void setWalletArchived(id, false))}>
      {t("Pulihkan")}
    </Button>
  );
}

function SelectedActions({ wallet }: { wallet: Wallet }) {
  const [pending, start] = useTransition();
  const [confirm, dialog] = useConfirm();
  const t = useT();
  return (
    <div className="-mr-1 -mb-1 flex">
      <Link
        href={`/analitik?dompet=${wallet.id}`}
        aria-label={t("Lihat transaksi {name}", { name: wallet.name })}
        title={t("Lihat transaksi di Analitik")}
        className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/15"
      >
        <Icon name="receipt_long" className="text-[18px]" />
      </Link>
      <WalletDialog wallet={wallet} label={t("Ubah {name}", { name: wallet.name })} variant="icon">
        <Icon name="edit" className="text-[18px]" />
      </WalletDialog>
      {dialog}
      <IconButton
        disabled={pending}
        onClick={async () => {
          const ok = await confirm({
            title: t("Arsipkan {name}?", { name: wallet.name }),
            message: t("Dompet disembunyikan dari pilihan dan total saldo. Riwayat transaksinya tetap tersimpan dan bisa dipulihkan kapan saja."),
            confirmLabel: t("Arsipkan"),
          });
          if (ok) start(() => void setWalletArchived(wallet.id, true));
        }}
        aria-label={t("Arsipkan {name}", { name: wallet.name })}
        tone="inherit"
      >
        <Icon name="archive" className="text-[18px]" />
      </IconButton>
    </div>
  );
}

const TYPE_ORDER: WalletType[] = ["bank", "ewallet", "credit", "cash", "other"];

/** One glass pocket per wallet type (bank, e-wallet, …), in a responsive grid. */
export function WalletStacks({ wallets }: { wallets: Wallet[] }) {
  const [open, setOpen] = useState<Wallet | null>(null);
  const columns = TYPE_ORDER.map((type) => ({ type, items: wallets.filter((w) => w.type === type) })).filter((c) => c.items.length);
  // Keep the modal's wallet fresh after an edit (server revalidates the list).
  const current = open && (wallets.find((w) => w.id === open.id) ?? null);
  return (
    <>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {columns.map((c, i) => (
          <FadeIn key={c.type} index={i}>
            <Pocket type={c.type} wallets={c.items} onOpen={setOpen} />
          </FadeIn>
        ))}
      </div>
      <CardModal wallet={current} onClose={() => setOpen(null)} />
    </>
  );
}

const STEP = 46; // how much of each card behind the front one peeks out
const FRONT = 112; // height of the frosted pocket front
const SHOWN = 0.5; // share of the front-most card visible above the pocket

const masked = (w: Wallet) => (w.card_last4 ? { number: `•••• ${w.card_last4}` } : undefined);

/**
 * A frosted-glass pocket holding a type's cards: they stack upward and peek out of the pocket, lift on hover,
 * and open the card modal on click. Bottom: type name + count, and a black "+" squircle to add one of this type.
 */
function Pocket({ type, wallets, onOpen }: { type: WalletType; wallets: Wallet[]; onOpen: (w: Wallet) => void }) {
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const n = wallets.length;
  const height = (n - 1) * STEP + CARD_H * SHOWN + FRONT;

  return (
    <section aria-label={t(WALLET_TYPE_LABEL[type])} className="relative" style={{ height }} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {wallets.map((w, i) => (
        <motion.button
          key={w.id}
          type="button"
          onClick={() => onOpen(w)}
          aria-label={t("Buka kartu {name}", { name: w.name })}
          className="absolute inset-x-3 rounded-[16px] text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ top: i * STEP, zIndex: i + 1 }}
          initial={false}
          animate={{ y: hovered ? -10 - (n - 1 - i) * 4 : 0 }}
          whileHover={{ y: -18 - (n - 1 - i) * 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
        >
          <WalletFace wallet={w} card={masked(w)} />
        </motion.button>
      ))}

      <div
        className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 rounded-[28px] border border-white/60 bg-white/55 px-5 pt-6 pb-4 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.7)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)] dark:border-white/10 dark:bg-[#1c1c1e]/60 dark:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.08)]"
        style={{ height: FRONT }}
      >
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[20px] font-bold tracking-[-0.01em]">
            <Icon name={WALLET_ICON[type]} className="text-[20px] text-on-surface-variant" />
            {t(WALLET_TYPE_LABEL[type])}
          </h2>
          <p className="text-[13px] text-on-surface-variant tabular-nums">
            {t("{n} dompet", { n })} · <Money value={wallets.reduce((s, w) => s + w.balance, 0)} sensitive />
          </p>
        </div>
        <WalletDialog variant="squircle" defaultType={type} label={t("Tambah dompet {type}", { type: t(WALLET_TYPE_LABEL[type]) })}>
          <Icon name="add" className="text-[26px]" />
        </WalletDialog>
      </div>
    </section>
  );
}

const fmtDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(iso));
const groups4 = (n: string) => n.replace(/(.{4})/g, "$1 ").trim();

/** The chosen card in full: card details (revealable), actions, balance history and the latest transactions. */
function CardModal({ wallet, onClose }: { wallet: Wallet | null; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const [detail, setDetail] = useState<WalletDetail | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [shownFor, setShownFor] = useState<string | null>(null);
  const id = wallet?.id;
  // Refetch after an edit too (balance or card changed), not only when another wallet opens.
  const version = wallet ? `${wallet.balance}:${wallet.card_last4}` : "";

  // Another wallet opened: forget the previous one's revealed card and history (adjust state during render).
  if (id && id !== shownFor) {
    setShownFor(id);
    setDetail(null);
    setCard(null);
    setError(undefined);
  }
  useEffect(() => {
    if (!id) return;
    let live = true;
    walletDetail(id).then((d) => live && setDetail(d));
    return () => {
      live = false;
    };
  }, [id, version]);

  const reveal = () =>
    start(async () => {
      if (card) return setCard(null);
      const res = await revealCard(wallet!.id);
      setError(res.error);
      setCard(res.card ?? null);
    });

  const face =
    wallet?.card_last4 &&
    (card ? { number: groups4(card.number), expiry: card.expiry, holder: card.holder || undefined } : { number: `•••• •••• •••• ${wallet.card_last4}`, expiry: "••/••" });

  return (
    <Dialog open={!!wallet} onClose={onClose} title={wallet?.name ?? ""} glass>
      {wallet && (
        <div className="space-y-5">
          <WalletFace wallet={wallet} card={face || undefined} actions={<SelectedActions wallet={wallet} />} />
          {wallet.card_last4 && (
            <Button variant="tonal" size="sm" onClick={reveal} disabled={pending}>
              <Icon name={card ? "visibility_off" : "visibility"} className="text-[16px]" /> {card ? t("Sembunyikan data kartu") : t("Lihat data kartu")}
            </Button>
          )}
          <FormError message={error} />

          <section>
            <h3 className="mb-1.5 text-[15px] font-semibold">{t("Riwayat saldo")}</h3>
            {!detail ? (
              <Bone className="h-12 rounded-[12px]" />
            ) : detail.adjustments.length === 0 ? (
              <p className="text-[13px] text-on-surface-variant">{t("Belum ada perubahan saldo manual.")}</p>
            ) : (
              <ul className="divide-y divide-outline overflow-hidden rounded-[12px] bg-surface-dim/50">
                {detail.adjustments.map((a) => (
                  <li key={a.created_at} className="flex items-center justify-between gap-3 px-3 py-2 text-[14px]">
                    <span className="text-on-surface-variant">{fmtDate(a.created_at, locale)}</span>
                    <span className="tabular-nums">
                      <Money value={a.previous} sensitive /> → <Money value={a.balance} sensitive className="font-semibold" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-[15px] font-semibold">{t("Transaksi terakhir")}</h3>
              <Link href={`/analitik?dompet=${wallet.id}`} className="text-[13px] text-primary">
                {t("Semua")}
              </Link>
            </div>
            {!detail ? (
              <Bone className="h-24 rounded-[12px]" />
            ) : detail.recent.length === 0 ? (
              <p className="text-[13px] text-on-surface-variant">{t("Belum ada transaksi.")}</p>
            ) : (
              <ul className="divide-y divide-outline overflow-hidden rounded-[12px] bg-surface-dim/50">
                {detail.recent.map((r) => {
                  const out = r.kind === "expense" || (r.kind === "transfer" && r.wallet_id === wallet.id);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[14px]">
                      <span className="min-w-0">
                        <span className="block truncate">{r.note || r.category || t(r.kind === "transfer" ? "Transfer" : "Transaksi")}</span>
                        <span className="text-[12px] text-on-surface-variant">{fmtDate(r.occurred_at, locale)}</span>
                      </span>
                      <Money value={out ? -r.amount : r.amount} sign={r.kind === "transfer" ? "none" : "auto"} className="shrink-0 font-medium" />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}
