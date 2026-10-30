"use client";

import { animate, stagger } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Remounts on every menu switch (Next.js template): the new page's top-level blocks — title, cards, sections —
 * fade and rise in one after another. Runs before paint so nothing flashes; Reduce Motion keeps only the fade.
 */
export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let run: ReturnType<typeof animate> | undefined;
    const reveal = () => {
      const page = root.firstElementChild;
      const blocks = page ? ([...page.children].slice(0, 12) as HTMLElement[]) : [];
      if (!blocks.length) return;
      run?.stop();
      run = animate(blocks, still ? { opacity: [0, 1] } : { opacity: [0, 1], y: [14, 0], scale: [0.985, 1] }, {
        type: "spring",
        bounce: 0,
        duration: 0.45,
        delay: stagger(0.05),
      });
    };
    reveal();
    // The skeleton (loading.tsx) is swapped for the real page in place: reveal the real cards too.
    const mo = new MutationObserver(reveal);
    mo.observe(root, { childList: true });
    return () => {
      mo.disconnect();
      run?.stop();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
