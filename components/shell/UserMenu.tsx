import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/lib/actions/auth";

/** <details> gives an accessible dropdown without client JS. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <details className="relative">
      <summary
        aria-label={`Akun ${name}`}
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-gradient-to-b from-[#a1a1aa] to-[#71717a] text-[15px] font-semibold text-white"
      >
        {name.charAt(0).toUpperCase()}
      </summary>
      <div className="glass glass-thick absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-[14px] border border-outline p-1.5 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.25)]">
        <div className="px-3 py-2">
          <p className="text-[15px] font-semibold">{name}</p>
          <p className="truncate text-[13px] text-on-surface-variant">{email}</p>
        </div>
        <div className="my-1 h-px bg-outline" />
        <Link href="/pengaturan" className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[15px] hover:bg-surface-dim">
          <Icon name="settings" className="text-[18px] text-primary" /> Pengaturan
        </Link>
        <Link href="/pintasan" className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[15px] hover:bg-surface-dim">
          <Icon name="bolt" className="text-[18px] text-primary" /> Pintasan iPhone
        </Link>
        <form action={signOut}>
          <button className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[15px] text-negative hover:bg-surface-dim">
            <Icon name="logout" className="text-[18px]" /> Keluar
          </button>
        </form>
      </div>
    </details>
  );
}
