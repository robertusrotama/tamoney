import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full min-h-11 rounded-[10px] bg-surface-dim px-3.5 text-[17px] text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary disabled:opacity-50";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="px-1 text-[13px] text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} appearance-none ${props.className ?? ""}`} />;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-[10px] bg-negative-container px-3.5 py-2.5 text-[15px] text-negative">
      {message}
    </p>
  );
}
