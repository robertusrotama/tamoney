"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useUrlState } from "@/components/analytics/useUrlState";
import { Segmented } from "@/components/ui/Segmented";
import { useT } from "@/components/I18n";

type Tab = "goals" | "tagihan";

/** Rencana: Goals | Tagihan, switched instantly on the client and mirrored in ?tab=. */
export function PlanTabs({ initial, goals, bills }: { initial: Tab; goals: ReactNode; bills: ReactNode }) {
  const t = useT();
  const [{ tab }, set] = useUrlState<{ tab: string }>({ tab: initial });
  const current: Tab = tab === "tagihan" ? "tagihan" : "goals";
  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <Segmented
          value={current}
          onChange={(v) => set({ tab: v })}
          options={[
            { value: "goals", label: t("Goals") },
            { value: "tagihan", label: t("Tagihan") },
          ]}
        />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {current === "goals" ? goals : bills}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
