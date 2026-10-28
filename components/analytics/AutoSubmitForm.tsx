"use client";

import { useEffect } from "react";

/**
 * Empty GET form; fields join it with form={id} so they can sit anywhere on the page without nesting other forms.
 * Submits when one of its fields commits a change (select/month pick, Enter or blur on text).
 */
export function AutoSubmitForm({ id }: { id: string }) {
  useEffect(() => {
    const onChange = (e: Event) => {
      const form = (e.target as HTMLInputElement).form;
      if (form?.id === id) form.requestSubmit();
    };
    document.addEventListener("change", onChange); // native "change", not React's per-keystroke onChange
    return () => document.removeEventListener("change", onChange);
  }, [id]);
  return <form id={id} method="get" />;
}
