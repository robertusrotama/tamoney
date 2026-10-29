"use client";

import { motion } from "motion/react";
import { useT } from "@/components/I18n";

/**
 * Placeholder block that breathes while a page loads. One shared rhythm (all bones in phase), ~0.7 Hz —
 * well away from the slow ~0.2 Hz oscillation Apple flags as uncomfortable. Opacity only, so it still
 * runs (gently) under Reduce Motion, which only removes transforms.
 */
export function Bone({ className = "" }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      className={`rounded-[10px] bg-surface-dim ${className}`}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Large title area: small date line + title. */
export function TitleBones({ action }: { action?: boolean }) {
  return (
    <div className="flex items-end justify-between px-1">
      <div className="space-y-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-8 w-56" />
      </div>
      {action && <Bone className="h-10 w-44 rounded-full" />}
    </div>
  );
}

/** Inset-grouped list with icon tile + two lines + amount per row. */
export function ListBones({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[14px] bg-card">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Bone className="size-8 shrink-0 rounded-[8px]" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3.5 w-2/5" />
            <Bone className="h-3 w-1/4" />
          </div>
          <Bone className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Screen-reader announcement for every skeleton screen. */
export function LoadingLabel() {
  const t = useT();
  return (
    <p role="status" className="sr-only">
      {t("Memuat…")}
    </p>
  );
}
