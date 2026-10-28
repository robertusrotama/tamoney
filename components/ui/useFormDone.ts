"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import type { ActionState } from "@/lib/actions/state";

/**
 * Submits via onSubmit so a failed save keeps what the user typed (React resets <form action> after every submit).
 * `version` bumps on success: use it as the form's key to clear it. onDone runs after each success.
 */
export function useFormDone(action: (prev: ActionState, fd: FormData) => Promise<ActionState>, onDone?: () => void) {
  const [state, dispatch, pending] = useActionState(action, {});
  const [seen, setSeen] = useState(state);
  const [version, setVersion] = useState(0);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setVersion((v) => v + 1);
  }
  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, pending, onSubmit, version };
}
