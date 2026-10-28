import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/lib/actions/auth";

/** <details> gives an accessible dropdown without client JS. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 hover:bg-surface-dim">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-semibold sm:block">{name}</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-outline-variant bg-card p-2 shadow-xl">
        <p className="truncate px-3 py-2 text-xs text-on-surface-variant">{email}</p>
        <form action={signOut}>
          <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-negative hover:bg-negative-container">
            <Icon name="logout" className="text-lg" /> Keluar
          </button>
        </form>
      </div>
    </details>
  );
}
