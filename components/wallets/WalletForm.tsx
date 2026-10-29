"use client";

import { motion } from "motion/react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AmountInput } from "@/components/ui/AmountInput";
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

function WalletForm({ wallet, onDone }: { wallet?: Wallet; onDone: () => void }) {
  const { state, pending, onSubmit } = useFormDone(saveWallet, onDone);
  // Controlled only so the preview card updates live as you type and pick
  const [name, setName] = useState(wallet?.name ?? "");
  const [type, setType] = useState<WalletType>(wallet?.type ?? "cash");
  const [color, setColor] = useState(wallet?.color ?? "");
  const [pattern, setPattern] = useState(wallet?.pattern ?? "");
  const look = { type, color: color || null, pattern: pattern || null };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {wallet && <input type="hidden" name="id" value={wallet.id} />}
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="pattern" value={pattern} />

      <WalletFace wallet={{ ...look, name: name || "Dompet baru", balance: wallet?.balance ?? 0 }} />

      <Field label="Nama dompet">
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required placeholder="Contoh: BCA, GoPay, Tunai" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jenis">
          <Picker
            name="type"
            label="Jenis"
            value={type}
            onChange={(v) => setType(v as WalletType)}
            options={(Object.keys(WALLET_TYPE_LABEL) as WalletType[]).map((v) => ({ value: v, label: WALLET_TYPE_LABEL[v], icon: WALLET_ICON[v] }))}
          />
        </Field>
        <Field label="Saldo awal">
          <AmountInput name="initial_balance" defaultValue={wallet?.initial_balance} required={false} />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="px-1 text-[13px] text-on-surface-variant">Warna kartu</legend>
        <div role="radiogroup" aria-label="Warna kartu" className="flex flex-wrap gap-2.5">
          <Swatch label="Otomatis (sesuai jenis)" selected={!color} onSelect={() => setColor("")} style={cardStyle({ type })}>
            <Icon name="auto_awesome" className="text-[15px] text-white" />
          </Swatch>
          {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
            <Swatch key={c} label={CARD_COLORS[c][2]} selected={color === c} onSelect={() => setColor(c)} style={cardStyle({ type, color: c })} />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="px-1 text-[13px] text-on-surface-variant">Motif</legend>
        <div role="radiogroup" aria-label="Motif" className="grid grid-cols-5 gap-2">
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
                <span className={`block text-[12px] ${selected ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>{CARD_PATTERNS[p].label}</span>
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      <FormError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Simpan"}
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
}: {
  wallet?: Wallet;
  children: ReactNode;
  label?: string;
  variant?: "primary" | "tonal" | "icon";
}) {
  const d = useDialog();
  return (
    <>
      {variant === "icon" ? (
        <IconButton onClick={d.show} aria-label={label} tone="inherit">
          {children}
        </IconButton>
      ) : (
        <Button variant={variant} onClick={d.show}>
          {children}
        </Button>
      )}
      <Dialog open={d.open} origin={d.origin} onClose={d.close} title={wallet ? "Ubah Dompet" : "Tambah Dompet"}>
        <WalletForm wallet={wallet} onDone={d.close} />
      </Dialog>
    </>
  );
}
