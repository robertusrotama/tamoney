"use client";

import { motion } from "motion/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AmountInput } from "@/components/ui/AmountInput";
import { useT } from "@/components/I18n";
import { Button, IconButton } from "@/components/ui/Button";
import { Dialog, useDialog } from "@/components/ui/Dialog";
import { Field, FormError, Input } from "@/components/ui/Field";
import { Picker } from "@/components/ui/Picker";
import { useFormDone } from "@/components/ui/useFormDone";
import { saveWallet } from "@/lib/actions/wallets";
import { Icon } from "@/components/ui/Icon";
import { WALLET_TYPE_LABEL, type Wallet, type WalletType } from "@/lib/types";
import { CARD_COLORS, CARD_PATTERNS, WALLET_ICON, cardStyle, type CardColor, type CardPattern } from "./style";
import { WalletFace } from "./WalletFace";

function WalletForm({ wallet, defaultType, onDone }: { wallet?: Wallet; defaultType?: WalletType; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(saveWallet, onDone);
  const t = useT();
  // Controlled only so the preview card updates live as you type and pick
  const [name, setName] = useState(wallet?.name ?? "");
  const [type, setType] = useState<WalletType>(wallet?.type ?? defaultType ?? "cash");
  const [color, setColor] = useState(wallet?.color ?? "");
  const [pattern, setPattern] = useState(wallet?.pattern ?? "");
  const look = { type, color: color || null, pattern: pattern || null };
  const cardType = type === "bank" || type === "credit";
  // Stored card: keep it unless the user replaces or removes it.
  const [cardMode, setCardMode] = useState<"keep" | "edit" | "clear">(wallet?.card_last4 ? "keep" : "edit");

  return (
    <form method="post" onSubmit={onSubmit} className="space-y-4">
      {wallet && <input type="hidden" name="id" value={wallet.id} />}
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="pattern" value={pattern} />

      <WalletFace wallet={{ ...look, name: name || t("Dompet baru"), balance: wallet?.balance ?? 0 }} />

      <Field label={t("Nama dompet")}>
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required placeholder={t("Contoh: BCA, GoPay, Tunai")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Jenis")}>
          <Picker
            name="type"
            label={t("Jenis")}
            value={type}
            onChange={(v) => setType(v as WalletType)}
            options={(Object.keys(WALLET_TYPE_LABEL) as WalletType[]).map((v) => ({ value: v, label: WALLET_TYPE_LABEL[v], icon: WALLET_ICON[v] }))}
          />
        </Field>
        <Field label={t("Saldo saat ini")} info={wallet ? t("Setiap perubahan saldo tercatat di riwayat dompet") : undefined}>
          <AmountInput name="balance" defaultValue={wallet?.balance} required={false} />
        </Field>
      </div>

      {cardType && (
        <fieldset className="space-y-3 rounded-[16px] bg-surface-dim/50 p-3">
          <legend className="flex items-center gap-1 px-1 text-[13px] font-medium text-on-surface-variant">
            <Icon name="lock" className="text-[15px]" /> {t("Data kartu (terenkripsi)")}
          </legend>
          {cardMode === "keep" ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[15px] tabular-nums">•••• •••• •••• {wallet?.card_last4}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCardMode("edit")}>
                {t("Ganti")}
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={() => setCardMode("clear")}>
                {t("Hapus")}
              </Button>
            </div>
          ) : cardMode === "clear" ? (
            <div className="flex items-center gap-2">
              <input type="hidden" name="card_clear" value="1" />
              <span className="flex-1 text-[15px] text-on-surface-variant">{t("Data kartu akan dihapus saat disimpan")}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCardMode("keep")}>
                {t("Batal")}
              </Button>
            </div>
          ) : (
            <>
              <Field label={t("Nomor kartu")}>
                <Input name="card_number" inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" maxLength={23} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("Berlaku hingga")}>
                  <Input name="card_expiry" inputMode="numeric" autoComplete="off" placeholder="BB/TT" maxLength={5} />
                </Field>
                <Field label={t("Nama di kartu")}>
                  <Input name="card_holder" autoComplete="off" maxLength={40} placeholder={t("Opsional")} />
                </Field>
              </div>
              <p className="px-1 text-[12px] text-on-surface-variant">{t("CVV tidak pernah disimpan.")}</p>
            </>
          )}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="px-1 text-[13px] text-on-surface-variant">{t("Warna kartu")}</legend>
        <div role="radiogroup" aria-label={t("Warna kartu")} className="flex flex-wrap gap-2.5">
          <Swatch label={t("Otomatis (sesuai jenis)")} selected={!color} onSelect={() => setColor("")} style={cardStyle({ type })}>
            <Icon name="auto_awesome" className="text-[15px] text-white" />
          </Swatch>
          {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
            <Swatch key={c} label={t(CARD_COLORS[c][2])} selected={color === c} onSelect={() => setColor(c)} style={cardStyle({ type, color: c })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="px-1 text-[13px] text-on-surface-variant">{t("Motif")}</legend>
        <div role="radiogroup" aria-label={t("Motif")} className="grid grid-cols-5 gap-2">
          {(Object.keys(CARD_PATTERNS) as CardPattern[]).map((p) => {
            const selected = (pattern || "plain") === p;
            return (
              <motion.button
                key={p}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPattern(p === "plain" ? "" : p)}
                whileTap={{ scale: 0.94 }}
                className="space-y-1 text-center"
              >
                <span
                  style={cardStyle({ ...look, pattern: p })}
                  className={`block h-10 rounded-[8px] ring-offset-2 ring-offset-card ${selected ? "ring-2 ring-primary" : ""}`}
                />
                <span className={`block text-[12px] ${selected ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>{t(CARD_PATTERNS[p].label)}</span>
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("Menyimpan…") : t("Simpan")}
      </Button>
    </form>
  );
}

function Swatch({ label, selected, onSelect, style, children }: { label: string; selected: boolean; onSelect: () => void; style: CSSProperties; children?: ReactNode }) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      whileTap={{ scale: 0.88 }}
      animate={{ scale: selected ? 1.08 : 1 }}
      style={style}
      className={`flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card ${selected ? "ring-2 ring-primary" : ""}`}
    >
      {children}
    </motion.button>
  );
}

/** A button that opens the wallet form in a dialog (add when no wallet, edit otherwise). */
export function WalletDialog({
  wallet,
  children,
  label,
  variant = "primary",
  defaultType,
}: {
  wallet?: Wallet;
  children: ReactNode;
  label?: string;
  /** squircle = the black "+" tile on a wallet pocket */
  variant?: "primary" | "tonal" | "icon" | "ghost" | "squircle";
  defaultType?: WalletType;
}) {
  const d = useDialog();
  const t = useT();
  return (
    <>
      {variant === "icon" ? (
        <IconButton onClick={d.show} aria-label={label} tone="inherit">
          {children}
        </IconButton>
      ) : variant === "squircle" ? (
        <motion.button
          type="button"
          onClick={d.show}
          aria-label={label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-[#111] text-white shadow-[0_8px_20px_-8px_rgb(0_0_0/0.6)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-white dark:text-[#111]"
        >
          {children}
        </motion.button>
      ) : (
        <Button variant={variant} onClick={d.show}>
          {children}
        </Button>
      )}
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={wallet ? t("Ubah Dompet") : t("Tambah Dompet")}>
        <WalletForm wallet={wallet} defaultType={defaultType} onDone={d.close} />
      </Dialog>
    </>
  );
}
