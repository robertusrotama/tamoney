"use client";

import { useSyncExternalStore } from "react";

/** Live media-query match. Server render assumes false (desktop layout first, like the rest of the app). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
