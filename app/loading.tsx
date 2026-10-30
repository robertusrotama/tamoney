import { LoadingScreen } from "@/components/LoadingScreen";

/**
 * Root fallback: wraps every route under the root layout, including the (app) layout that waits for wallets,
 * budget and notifications — so the first paint is this screen instead of a blank page (iPhone Safari, PWA, web).
 * In-app navigation keeps the nearer per-page skeletons.
 */
export default function Loading() {
  return <LoadingScreen />;
}
