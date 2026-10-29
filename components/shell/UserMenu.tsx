import Link from "next/link";
import { Avatar, type Profile } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/lib/actions/auth";

/** <details> gives an accessible dropdown without client JS. */
export function UserMenu({ profile, email }: { profile: Profile; email: string }) {
  const name = profile.display_name;
  return (
    <details className="relative">
      <summary
        aria-label={`Akun ${name}`}
        className="flex cursor-pointer list-none rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Avatar profile={profile} />
      </summary>
      <div className="glass glass-thick absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-[14px] border border-outline p-1.5 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.25)]">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Avatar profile={profile} size={40} />
          <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{name}</p>
          <p className="truncate text-[13px] text-on-surface-variant">{email}</p>
          </div>
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
