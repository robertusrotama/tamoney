import Link from "next/link";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { todayWib } from "@/lib/reports";

/** Split auth screen: form panel (logo pill, centered form, footer) + TaMoney visual panel on desktop. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="min-h-dvh bg-surface p-3 lg:p-4">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1440px] gap-3 rounded-[32px] bg-card p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] lg:min-h-[calc(100dvh-2rem)] lg:grid-cols-[minmax(440px,0.9fr)_1.1fr]">
        <section
          className="flex flex-col rounded-[24px] px-5 py-5 sm:px-10 lg:px-14"
          style={{ backgroundImage: "radial-gradient(80% 50% at 30% 100%, var(--c-primary-container), transparent 70%)" }}
        >
          <Link href="/masuk" className="self-start rounded-full border border-outline px-5 py-2 text-[20px] font-semibold tracking-[-0.02em] hover:bg-surface-dim">
            TaMoney
          </Link>
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[380px]">{children}</div>
          </div>
          <p className="text-[13px] text-on-surface-variant">© {new Date().getFullYear()} TaMoney · Catat keuangan pribadi</p>
        </section>
        <AuthVisual today={todayWib()} />
      </div>
    </main>
  );
}
