import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <FadeIn className="w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#0a84ff] to-[#0040dd] text-white shadow-[0_10px_24px_-8px_rgb(0_122_255/0.6)]">
            <Icon name="account_balance_wallet" className="text-[34px]" filled />
          </span>
          <p className="text-[28px] font-bold tracking-[-0.02em]">TaMoney</p>
        </div>
        <div className="rounded-[20px] bg-card p-6">{children}</div>
      </FadeIn>
    </main>
  );
}
