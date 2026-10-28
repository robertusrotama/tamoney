import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-outline bg-surface px-4 py-2.5 text-sm outline-none transition focus:bg-card focus:ring-2 focus:ring-primary disabled:opacity-60";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-negative-container px-4 py-2.5 text-sm text-on-negative-container">
      {message}
    </p>
  );
}
