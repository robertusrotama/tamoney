"use client";

import { useState } from "react";

/**
 * Client-only filter state mirrored into the URL with history.replaceState: instant (no server round
 * trip, no re-render of the server page) yet refresh/share/back still restore it. Empty values are dropped.
 */
export function useUrlState<T extends Record<string, string>>(initial: T) {
  const [state, setState] = useState(initial);
  const set = (patch: Partial<T>) => {
    const next = { ...state, ...patch };
    setState(next);
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v) sp.set(k, v as string);
      else sp.delete(k);
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${sp}`);
  };
  return [state, set] as const;
}

export const csv = (v: string) => (v ? v.split(",") : []);
