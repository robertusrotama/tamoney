"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useT } from "@/components/I18n";
import { IconButton } from "./Button";
import { Icon } from "./Icon";

/**
 * The one field look shared by every input-like control (Input, AmountInput, Picker, DateField,
 * PasswordField, SearchField): 48px tall pill-rounded fill, blue ring on focus.
 */
export const fieldClass =
  "w-full h-12 rounded-[14px] bg-surface-dim px-4 text-[17px] text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary focus-within:ring-2 focus-within:ring-primary disabled:opacity-50";
/** @deprecated name kept for existing imports */
export const inputClass = fieldClass;

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between px-1 text-[13px] font-medium text-on-surface-variant">
        {label}
        {hint && <span className="font-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

/** Password with a show/hide toggle inside the field. */
export function PasswordField(props: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  const t = useT();
  return (
    <div className={`${fieldClass} flex items-center gap-2 pr-1.5`}>
      <input {...props} type={show ? "text" : "password"} className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-on-surface-variant" />
      <IconButton onClick={() => setShow((s) => !s)} aria-label={show ? t("Sembunyikan password") : t("Tampilkan password")} aria-pressed={show}>
        <Icon name={show ? "visibility_off" : "visibility"} className="text-[20px]" />
      </IconButton>
    </div>
  );
}

/** Server messages are Indonesian keys; shown in the UI language. */
export function FormError({ message }: { message?: string }) {
  const t = useT();
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-2 rounded-[12px] bg-negative-container px-4 py-3 text-[15px] text-negative">
      <Icon name="error" className="text-[18px]" filled />
      {t(message)}
    </p>
  );
}
