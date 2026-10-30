"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { useT } from "@/components/I18n";
import { pageItems } from "@/lib/paging";
import { Icon } from "./Icon";

const edge =
  "flex h-10 shrink-0 whitespace-nowrap items-center gap-1 rounded-full px-3 text-[17px] font-medium hover:bg-surface-dim focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:text-on-surface-variant/60";

/** ‹ Previous  1 2 3 … 12  Next ›  — the current page sits in a soft grey circle that glides between numbers. */
export function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const t = useT();
  const id = useId();
  if (total <= 1) return null;
  return (
    <nav aria-label={t("Halaman")} className="@container flex items-center justify-center gap-1">
      <button type="button" className={edge} onClick={() => onPage(page - 1)} disabled={page <= 1}>
        <Icon name="chevron_left" className="text-[22px]" />
        <span className="@max-[400px]:sr-only">{t("Sebelumnya")}</span>
      </button>
      {pageItems(page, total).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} aria-hidden className="w-8 text-center text-[17px] text-on-surface-variant">
            …
          </span>
        ) : (
          <motion.button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t("Halaman {n}", { n: p })}
            whileTap={{ scale: 0.92 }}
            className="relative flex size-10 items-center justify-center rounded-full text-[17px] font-medium tabular-nums hover:bg-surface-dim focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {p === page && <motion.span layoutId={`page-${id}`} className="absolute inset-0 rounded-full bg-surface-dim" transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />}
            <span className="relative">{p}</span>
          </motion.button>
        ),
      )}
      <button type="button" className={edge} onClick={() => onPage(page + 1)} disabled={page >= total}>
        <span className="@max-[400px]:sr-only">{t("Berikutnya")}</span>
        <Icon name="chevron_right" className="text-[22px]" />
      </button>
    </nav>
  );
}
