"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const ITEMS = [
  { href: "/", label: "Dashboard", short: "Dashboard", icon: "dashboard" },
  { href: "/analitik", label: "Analitik & Riwayat", short: "Analitik", icon: "query_stats" },
  { href: "/dompet", label: "Kelola Dompet", short: "Dompet", icon: "account_balance_wallet" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-70 flex-col bg-card px-4 py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:flex">
      <Link href="/" className="mb-8 px-3">
        <p className="text-2xl font-extrabold tracking-tight text-primary">TaMoney</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Kelola Finansial</p>
      </Link>
      <nav className="space-y-1">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isActive(path, i.href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-dim aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
          >
            <Icon name={i.icon} />
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-outline-variant bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(path, i.href) ? "page" : undefined}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-on-surface-variant aria-[current=page]:text-primary"
        >
          <Icon name={i.icon} />
          {i.short}
        </Link>
      ))}
    </nav>
  );
}
