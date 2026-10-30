"use client";

import { AnimatePresence, motion } from "motion/react";
import { startTransition, useActionState, useState, useTransition, type FormEvent } from "react";
import { useT } from "@/components/I18n";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { FormError, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { createToken, revokeToken } from "@/lib/actions/tokens";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="tonal"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      <Icon name={done ? "check" : "content_copy"} className="text-[16px]" /> {done ? t("Tersalin") : label}
    </Button>
  );
}

/** Creates a token and shows it exactly once. */
export function CreateToken() {
  const t = useT();
  const [state, dispatch, pending] = useActionState(createToken, {});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };

  return (
    <div className="space-y-3">
      <form method="post" onSubmit={onSubmit} className="flex gap-2">
        <Input name="name" placeholder={t("Nama perangkat, mis. iPhone Tama")} maxLength={50} className="flex-1" />
        <Button type="submit" disabled={pending}>
          {pending ? t("Membuat…") : t("Buat Token")}
        </Button>
      </form>
      <FormError message={state.error} />
      <AnimatePresence>
        {state.token && (
          <motion.div
            key={state.token}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-[12px] bg-positive-container p-3.5"
          >
            <p className="text-[13px] font-semibold text-positive">{t("Salin sekarang — token ini hanya ditampilkan sekali.")}</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-[8px] bg-card px-2.5 py-2 text-[13px] tabular-nums">{state.token}</code>
              <CopyButton text={state.token} label={t("Salin")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RevokeButton({ id, name }: { id: string; name: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [confirm, dialog] = useConfirm();
  return (
    <>
      {dialog}
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={async () => {
          const ok = await confirm({
            title: t("Cabut token {name}?", { name: `"${name}"` }),
            message: t("Shortcut yang memakai token ini akan berhenti bekerja. Tindakan ini tidak bisa dibatalkan."),
            confirmLabel: t("Cabut"),
            destructive: true,
          });
          if (ok) start(() => void revokeToken(id));
        }}
      >
        {t("Cabut")}
      </Button>
    </>
  );
}
