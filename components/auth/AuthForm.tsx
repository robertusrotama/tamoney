"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useT } from "@/components/I18n";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input, PasswordField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useFormDone } from "@/components/ui/useFormDone";
import type { ActionState } from "@/lib/actions/state";

type FieldDef = { name: string; label: string; type: string; autoComplete: string; placeholder?: string; hint?: ReactNode };

/** Shared body of every auth page: centered title + subtitle, labeled fields, one large primary CTA. Texts are Indonesian keys. */
export function AuthForm({
  title,
  subtitle,
  action,
  fields,
  submitLabel,
  successMessage,
  footer,
}: {
  title: string;
  subtitle: string;
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  fields: FieldDef[];
  submitLabel: string;
  successMessage?: string;
  footer?: ReactNode;
}) {
  const { state, pending, onSubmit } = useFormDone(action);
  const t = useT();

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-[clamp(1.75rem,1.4rem+1.4vw,2.25rem)] leading-tight font-semibold tracking-[-0.025em]">{t(title)}</h1>
        <p className="text-[17px] text-on-surface-variant">{t(subtitle)}</p>
      </div>
      {state.ok && successMessage ? (
        <p role="status" className="flex items-start gap-3 rounded-[14px] bg-positive-container px-4 py-4 text-[15px] text-positive">
          <Icon name="mark_email_read" className="text-[22px]" filled />
          {t(successMessage)}
        </p>
      ) : (
        <form method="post" onSubmit={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <Field label={t(f.label)}>
                {f.type === "password" ? (
                  <PasswordField name={f.name} autoComplete={f.autoComplete} placeholder={f.placeholder && t(f.placeholder)} required />
                ) : (
                  <Input name={f.name} type={f.type} autoComplete={f.autoComplete} placeholder={f.placeholder && t(f.placeholder)} required />
                )}
              </Field>
              {f.hint && <div className="px-1 text-right text-[13px]">{f.hint}</div>}
            </div>
          ))}
          <FormError message={state.error} />
          <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
            {pending ? t("Memproses…") : t(submitLabel)}
          </Button>
        </form>
      )}
      {footer && <div className="text-center text-[15px] text-on-surface-variant">{footer}</div>}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
