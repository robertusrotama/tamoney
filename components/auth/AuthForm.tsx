"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/actions/state";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input } from "@/components/ui/Field";
import { useFormDone } from "@/components/ui/useFormDone";

type FieldDef = { name: string; label: string; type: string; autoComplete: string };

export function AuthForm({
  title,
  action,
  fields,
  submitLabel,
  successMessage,
  footer,
}: {
  title: string;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  fields: FieldDef[];
  submitLabel: string;
  successMessage?: string;
  footer?: ReactNode;
}) {
  const { state, pending, onSubmit } = useFormDone(action);

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-bold tracking-[-0.01em]">{title}</h1>
      {state.ok && successMessage ? (
        <p role="status" className="rounded-[10px] bg-positive-container px-3.5 py-3 text-[15px] text-positive">
          {successMessage}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              <Input name={f.name} type={f.type} autoComplete={f.autoComplete} required />
            </Field>
          ))}
          <FormError message={state.error} />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Memproses…" : submitLabel}
          </Button>
        </form>
      )}
      {footer && <div className="space-y-1 text-center text-[15px] text-on-surface-variant">{footer}</div>}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-primary">
      {children}
    </Link>
  );
}
