"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** House spring: critically damped (Apple damping 1.0, response ~0.35s). Reduced motion → no transforms. */
export const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;
/** Only after a gesture that carried momentum (a flick). */
export const SPRING_MOMENTUM = { type: "spring", bounce: 0.2, duration: 0.4 } as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig transition={SPRING} reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
