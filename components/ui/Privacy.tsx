"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useT } from "@/components/I18n";
import { HIDE_BALANCE_COOKIE } from "@/components/shell/prefs";
import { IconButton } from "./Button";
import { Icon } from "./Icon";

const Ctx = createContext<{ hidden: boolean; toggle: () => void }>({ hidden: false, toggle: () => {} });

export function PrivacyProvider({ initial, children }: { initial: boolean; children: ReactNode }) {
  const [hidden, setHidden] = useState(initial);
  const toggle = () => {
    setHidden((h) => {
      document.cookie = `${HIDE_BALANCE_COOKIE}=${h ? 0 : 1}; path=/; max-age=31536000; samesite=lax`;
      return !h;
    });
  };
  return <Ctx.Provider value={{ hidden, toggle }}>{children}</Ctx.Provider>;
}

export const useBalancesHidden = () => useContext(Ctx).hidden;

/** Eye next to a balance: hides every sensitive amount (<Money sensitive>) app-wide. */
export function BalanceEye({ className = "" }: { className?: string }) {
  const { hidden, toggle } = useContext(Ctx);
  const t = useT();
  return (
    <IconButton onClick={toggle} aria-pressed={hidden} aria-label={hidden ? t("Tampilkan saldo") : t("Sembunyikan saldo")} className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={String(hidden)} className="flex" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}>
          <Icon name={hidden ? "visibility_off" : "visibility"} className="text-[20px]" />
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
