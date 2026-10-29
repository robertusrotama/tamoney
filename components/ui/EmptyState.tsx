import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center text-on-surface-variant">
      <Icon name={icon} className="mb-1 text-[40px] opacity-60" />
      <p className="text-[17px] font-semibold text-on-surface">{title}</p>
      {children}
    </div>
  );
}

/** Inset-grouped container (iOS Settings style): no border, no shadow, separation by color. */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-[14px] bg-card p-4 ${className}`}>{children}</section>;
}

/** Section header above a grouped card. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[13px] font-medium text-on-surface-variant ${className}`}>{children}</p>;
}
