import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-on-surface-variant">
      <Icon name={icon} className="text-4xl" />
      <p className="font-semibold text-on-surface">{title}</p>
      {children}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-2xl border border-outline-variant bg-card p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] font-medium uppercase tracking-wider text-on-surface-variant ${className}`}>{children}</p>;
}
